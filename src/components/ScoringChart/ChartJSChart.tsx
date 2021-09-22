import React from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { INode } from './ScoringChart';
import ScreenInfo from 'services/ScreenInfo';
import Theme from 'services/Theme';
import { logger } from 'services/logger';
import { $labels } from 'services/i18n';
import Colour from 'services/Colour';

interface Props {
  guid: string; // reference to item we are charting
  chartType: 'radar' | 'line' | 'bar';
  actual: boolean; // show Actuals (assessor score)
  self: boolean;   // show Self-Assessment (if SA on)
  target: boolean; // show Targets (if targets at dim|exp level)
  width: number;
  height: number;
  selfScoreShade: string;
  assessorScoreShade: string;
  targetShade: string;
  nodes: INode[];
  max: number;
  zoomed: boolean;
}
interface State {
  refreshKey: number;
}

export class ChartJSChart extends React.Component<Props, State> {

  private webRef: any;
  private chartData: any = {};
  private initialised: boolean = false;
  private json: string = '';
  private subtype: 'radar' | 'line' | 'bar' = 'radar';

  constructor(props: Props) {
    super(props);
    this.state = { refreshKey: 0 };
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    // logger('CWRP', nextProps);
    this.makeData(nextProps);
  }

  makeData(props: Props = this.props, init: boolean = false) {
    // transform state.nodes into ChartData that chartjs understands. Move this to common area for charts.
    if (!this.initialised || props.guid === '') {
      return;
    }
    // logger('MakeData!', props.guid);

    // Common options
    const options: any = {
      // animation: {
      //   duration: 500,
      //   easing: 'easeInQuad'
      // },
      maintainAspectRatio: true,
      spanGaps: false,
      legend: {
        display: false
      }
    };

    if (props.chartType === 'radar') {
      // Options for radar chart
      options.layout = {
        padding: ScreenInfo.supportsDualPane() ? 10 : 10
      };
      options.elements = {
        line: {
          tension: 0.4 // smoothing
        }
      };
      options.scale = {
        display: true,
        pointLabels: {
          fontSize: ScreenInfo.supportsDualPane() ? 18 : 18, // works, short labels round edge
          fontColor: 'white'
        },
        scaleLabel: {
          fontSize: 24
        },
        gridLines: {
          color: 'rgba(255,255,255,0.1)' // grid lines round
        },
        angleLines: {
          color: 'rgba(255,255,255,0.1)' // spokes
        },
        ticks: {
          display: !props.zoomed, // toggles the axis scale
          fontSize: ScreenInfo.supportsDualPane() ? 16 : 16,
          fontColor: 'rgba(255,255,255,0.3)',
          backdropColor: 'transparent',
          stepSize: props.max === 100 ? 10 : 1
        }
      };
      if (!props.zoomed) {
        options.scale.ticks.min = 0;
        options.scale.ticks.max = props.max;
        options.scale.ticks.beginAtZero = true;
      }
    } else {
      // Options for bar and line charts
      options.layout = {
        padding: { top: 15, bottom: 5, left: 5, right: 15 }
      };
      options.scales = {
        xAxes: [{
          categoryPercentage: 0.8,
          barPercentage: 1.0,
          gridLines: {
            color: 'rgba(255,255,255,0.1)' // grid lines up
          },
          ticks: {
            fontSize: ScreenInfo.supportsDualPane() ? 16 : 16, // short labels
            fontColor: 'white',
            maxRotation: 0,
            minRotation: 0
          }
        }],
        yAxes: [{
          gridLines: {
            color: 'rgba(255,255,255,0.11)' // grid lines across
          },
          ticks: {
            stepSize: props.max === 100 ? 10 : 1,
            maxRotation: 0,
            minRotation: 0
          }
        }]
      };
      if (!props.zoomed) {
        options.scales.yAxes[0].ticks.min = 0;
        options.scales.yAxes[0].ticks.max = props.max;
        options.scales.yAxes[0].ticks.beginAtZero = true;
      }
    }

    this.chartData = {
      type: props.chartType,
      data: {
        labels: [],
        datasets: []
      },
      options
    };
    // first one plotted on top
    this.chartData.data.datasets.push({
      hidden: !props.actual,
      label: $labels.CHARTS.ASSESSOR_SCORES,
      backgroundColor: Colour.getTransparentColour(props.assessorScoreShade, props.chartType === 'bar' ? 0.5 : 0.2),
      borderColor: props.assessorScoreShade,
      data: [],
      pointBackgroundColor: props.assessorScoreShade
    });
    this.chartData.data.datasets.push({
      hidden: !props.self,
      label: $labels.CHARTS.COACH_SCORES,
      backgroundColor: Colour.getTransparentColour(props.selfScoreShade, props.chartType === 'bar' ? 0.5 : 0.2),
      borderColor: props.selfScoreShade,
      data: [],
      pointBackgroundColor: props.selfScoreShade
    });
    this.chartData.data.datasets.push({
      hidden: !props.target,
      type: props.chartType === 'bar' ? 'line' : undefined,
      label: $labels.CHARTS.TARGET,
      backgroundColor: props.chartType === 'bar' ? 'transparent' : Colour.getTransparentColour(props.targetShade, 0.2),
      borderColor: Colour.getTransparentColour(props.targetShade, 0.7),
      borderWidth: 2,
      data: [],
      pointBackgroundColor: props.targetShade
    });

    props.nodes.forEach((node: INode) => {
      this.chartData.data.labels.push(node.shortLabel);
      this.chartData.data.datasets[0].data.push(node.element ? node.element.assessorScore || 0 : 0);
      this.chartData.data.datasets[1].data.push(node.element ? node.element.selfScore || 0 : 0);
      this.chartData.data.datasets[2].data.push(node.element && node.element.target ? Math.round(node.element.target) || 0 : 0);
    });
    const jsonString = JSON.stringify(this.chartData);
    if (jsonString !== this.json || props.chartType !== this.subtype) {
      // logger('>>>>>> send:', jsonString);
      this.webRef.injectJavaScript(`setTimeout(function() {
        process('${jsonString}');
       }, 100); true;`
      );
      this.json = jsonString;
      this.subtype = props.chartType;
    }
  }

  onLoad() {
    // only send data to webView on or after onLoad
    this.initialised = true;
    this.makeData(this.props, true);
  }

  render() {
    // logger('render', this.props);
    // NB. rgb(22,34,56) is Theme.blue900 - for some reason hex color stopped working on Android
    const landscape = ScreenInfo.supportsDualPane();
    const html = `
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart.min.js"></script>
      </head>
      <body style="background-color:rgb(22,34,56);padding:0;margin:0;height:${this.props.height};width:${this.props.width};" >
        <canvas style="height:${this.props.height};width:${this.props.width};" id="myChart"></canvas>
      </body>
    </html>
    `;
    const jsCode = `
      var myChart = null;
      var chartType = '';
      setTimeout(function() {
        /* comments must be in this form not to break android */
        window.ReactNativeWebView.postMessage('INIT');
        Chart.defaults.global.elements.line.borderWidth = 1;
        Chart.defaults.global.elements.point.radius = ${ScreenInfo.supportsDualPane() ? 5 : 5};
        /* Chart.defaults.global.elements.point.borderColor = 'white'; */
        Chart.defaults.global.elements.point.pointStyle = 'circle';
        Chart.defaults.global.tooltips.enabled = false;
        /* Chart.defaults.global.elements.rectangle.borderWidth = 0; */
      }, 10);
      process = function(jsonString) {
        window.ReactNativeWebView.postMessage('RECV:' + jsonString);
        var cdata = JSON.parse(jsonString);
        window.ReactNativeWebView.postMessage('type:' + cdata.type);
        if (myChart !== null && cdata.type === chartType) {
          window.ReactNativeWebView.postMessage('UPDATE');
          myChart.data.labels = cdata.data.labels;
          myChart.options = cdata.options;
          for (var i = 0; i < 3; i++) {
            myChart.data.datasets[i].hidden = cdata.data.datasets[i].hidden;
            myChart.data.datasets[i].data = cdata.data.datasets[i].data;
            myChart.data.datasets[i].backgroundColor = cdata.data.datasets[i].backgroundColor;
            myChart.data.datasets[i].borderColor = cdata.data.datasets[i].borderColor;
            myChart.data.datasets[i].pointBackgroundColor = cdata.data.datasets[i].pointBackgroundColor;
          }
          myChart.update({
            duration: 500
          });
          return;
        }
        var ctx = document.getElementById("myChart").getContext('2d');
        if (myChart === null) {
         window.ReactNativeWebView.postMessage('NULL');
          /* Plot point values - we ony register this plugin once */
          Chart.plugins.register({
            afterDatasetsDraw: function (chart, easing) {
              /* if (easing === 1) { */
                var ctx = chart.ctx;
                chart.data.datasets.forEach(function (dataset, i) {
                  var meta = chart.getDatasetMeta(i);
                  if (!dataset.hidden && !meta.hidden && meta.type === 'radar' && !chart.options.scale.ticks.beginAtZero) {
                    meta.data.forEach(function (element, index) {
                      ctx.fillStyle = 'rgba(255,255,255,0.5)';
                      var fontSize = ${ScreenInfo.supportsDualPane() ? 16 : 16};
                      var fontStyle = 'normal';
                      var fontFamily = 'Helvetica Neue';
                      ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);
                      var dataString = dataset.data[index].toString();
                      if (dataString !== '0') {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        var padding = 2;
                        var position = element.tooltipPosition();
                        ctx.fillText(dataString, position.x, position.y - fontSize);
                      }
                    });
                  }
                });
              /* } */
            }
          });
        }
        chartType = cdata.type;
        myChart = new Chart(ctx, cdata);
        window.ReactNativeWebView.postMessage('NEW');
      };
      true;
    `;

    return (
      <WebView
        ref={(ref) => this.webRef = ref}
        source={{ html }}
        injectedJavaScript={jsCode}
        // originWhitelist={['*']}
        bounces={false}
        key={this.state.refreshKey}
        scrollEnabled={false}
        onNavigationStateChange={(navState) => console.log('nav ', navState)}
        // domStorageEnabled={false}
        // mixedContentMode={'always'}
        // thirdPartyCookiesEnabled={false}
        // allowsInlineMediaPlayback={true}
        //// allowUniversalAccessFromFileURLs={true}
        // startInLoadingState={true}
        mixedContentMode={'compatibility'}
        domStorageEnabled={true}
        startInLoadingState={Platform.OS === 'ios'} // affects ios font sizing if false, flashes white on android if true
        renderLoading={() => (<View style={{ flex: 1, backgroundColor: Theme.blue900 }} />)}
        // allowUniversalAccessFromFileURLs={true}
        // thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        // automaticallyAdjustContentInsets={true}
        // scalesPageToFit={true}
        style={{ flex: 1 }}
        onError={(err) => logger('onError', err)}
        // onLoadStart={() => logger('loadStart')}
        // onLoadEnd={() => logger('loadEnd')}
        onLoad={() => this.onLoad()}
        onMessage={(event) => logger('<<<<<<<<', event.nativeEvent.data)}
      />
    );
  }
}
