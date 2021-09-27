import React from 'react';
import { InModal, InModalProps } from './InModal';
import RoundButton from './RoundButton';
import { RowView } from './RowView';
import Theme from 'services/Theme';
import { View } from 'react-native';

/* Usage:

// in component:
private modalRef;

// in some function where we want to show a modal and get a decision:
const continue = await this.modalRef.show({
  yesLabel: $labels.COMMON.YES,       // continue=true
  noLabel: $labels.COMMON.NO,         // continue=false (also on modal closure)
  cancelLabel: $labels.COMMON.CANCEL, // catch exception
  content: this.renderSomething(someData),
  title: $labels.COMMON.WARNING
});
if (continue) ...

// in main render method (should even be able to re-use this for multiple modals):
<InModalPromise ref={(ref) => this.modalRef = ref} />
*/

interface Props { }
interface State {
  visible: boolean;
  props?: ShowProps;
}
interface ShowProps extends InModalProps {
  content?: any;
  yesLabel?: string;
  yesCallback?: () => boolean; // callback when yes tapped, to do some validation and to keep modal open if false
  noLabel?: string;
  cancelLabel?: string;
}

/**
 * InModal variant that exposes a show() method that can be used as a Promise (used via a ref)
 * - Yes/No buttons (when yesLabel/noLabel passed) resolve the promise as true/false
 * - Cancel button (when cancelLabel passed) rejects the promise (be prepared to catch)
 * So it can handle 0-3 buttons. Standard modal closure resolves promise as false.
 */
export class InModalPromise extends React.Component<Props, State> {
  private resolve;
  private reject;

  constructor(props: Props) {
    super(props);
    this.state = { visible: false, props: undefined };
  }

  public show(props: ShowProps): Promise<any> {
    this.setState({ props }); // copy the props to state
    setTimeout(() => this.setState({ visible: true }), 50); // make visible
    return new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  };

  private hide() {
    this.setState({ visible: false });
    setTimeout(() => { // give time to slide out before clearing content
      this.setState({ props: undefined });
    }, 500);
  }

  private yes() {
    // if yesCallback is not defined, or returns true, hide & resolve
    if (!this.state.props?.yesCallback || !!this.state.props?.yesCallback()) {
      this.hide();
      this.resolve(true);
    }
  };

  private no() {
    this.hide();
    this.resolve(false);
  };

  private cancel() {
    this.hide();
    this.reject();
  };

  render() {
    return <InModal {...this.state.props} isVisible={this.state.visible} onClose={() => this.no()}>
      {!!this.state.props?.content && this.state.props?.content}
      <RowView nowrap style={{ marginTop: 16 }}>
        {!!this.state.props?.yesLabel && <RoundButton radius={8} backColor={Theme.green} style={{ marginRight: 6 }} label={this.state.props.yesLabel} onPress={() => this.yes()} />}
        {!!this.state.props?.noLabel && <RoundButton radius={8} hollowBorder={1} style={{ marginRight: 6 }} label={this.state.props.noLabel} onPress={() => this.no()} />}
        {!!this.state.props?.cancelLabel && <RoundButton radius={8} backColor={'#aaa'} textStyle={{ color: 'white' }} label={this.state.props.cancelLabel} onPress={() => this.cancel()} />}
      </RowView>
      <View style={{ height: 10 }} />
    </InModal>;
  }
}
