# Ensure on each release you have updated android/app/build.gradle (and possibly android/app/src/main/AndroidManifest.xml ??):
#        versionCode 1
#        versionName "1.0"
# versionCode is an integer which Google Playstore recognises and does not allow to upload another APK having the same value. Just think of this as build number. 
# versionName is the version number of your application and visible in Google Play Store. Can use server format.
# See https://saumya.github.io/ray/articles/72/
#
# Note: requires innoved-ccf.keystore to be stored somewhere securely, outside version control, and placed in 
# ./android/app folder on any build machine. Curently stored in mail attachment between me, simon & development@innovedlearning.co.uk
# Also need ./android/gradle.properties file containing:
#   android.useDeprecatedNdk=true
#   MYAPP_RELEASE_STORE_FILE=innoved-ccf.keystore
#   MYAPP_RELEASE_KEY_ALIAS=innoved-ccf
#   MYAPP_RELEASE_STORE_PASSWORD=innoved123
#   MYAPP_RELEASE_KEY_PASSWORD=innoved123
# Currently we need both in the repo to be able to automate a build via AppCenter.

ENV=$1

if [ "$ENV" == "" ]; then
  echo ""
  echo Select Build Type:
  echo Enter [d]evelop \(default\), [t]est, [p]roduction, or ^C to abort
  read ENV
fi

if [ "$ENV" == "p" ]; then
  export ENVFILE=.env.prod
  echo PRODUCTION Build
  set -o allexport; source $ENVFILE; set +o allexport # expose all env file variables

  echo Switching to Firebase Production environment for Android
  cp -rf firebase_config/prod/google-services.json android/app

  rm -rf ./android/app/build/outputs/bundle/Release/*.aab
  npm run build
  npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
  cd android

  export REACT_NATIVE_MAX_WORKERS=2
  ./gradlew clean
  ./gradlew bundleRelease -x bundleReleaseJsAndAssets # .aab file for Google Play store

  cd ..
  cp ./android/app/build/outputs/bundle/release/app-release.aab ./android/app/build/outputs/bundle/release/app-release"${APP_VERSION}".aab
  ls -l ./android/app/build/outputs/bundle/Release/*.aab
  ls -l ./android/app/build/outputs/bundle/Release/app-release"${APP_VERSION}".aab >> build.log
  cp -rf firebase_config/test/google-services.json android/app # reset back to test config for firebase
else
  export ENVFILE=.env.test
  echo TEST Build
  set -o allexport; source $ENVFILE; set +o allexport # expose all env file variables

  echo Switching to Firebase Test environment for Android
  cp -rf firebase_config/test/google-services.json android/app

  rm -rf ./android/app/build/outputs/apk/release/*.apk
  npm run build
  npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
  cd android

  export REACT_NATIVE_MAX_WORKERS=2
  ./gradlew clean
  ./gradlew assembleRelease -x bundleReleaseJsAndAssets # .apk file for bluestacks & testfairy

  cd ..
  cp ./android/app/build/outputs/apk/release/app-release.apk ./android/app/build/outputs/apk/release/app-release"${APP_VERSION}".apk
  ls -l ./android/app/build/outputs/apk/release/*.apk
  ls -l ./android/app/build/outputs/apk/release/app-release"${APP_VERSION}".apk >> build.log

  # Upload to testfairy
  COMMENTS=$(cat build-comments.txt)
  if [ "$ENV" == "t" ]; then
    ./testfairy-upload.sh ./android/app/build/outputs/apk/release/app-release.apk beta_android "${COMMENTS}"
  elif [ "$ENV" == "d" ] || [ "$ENV" == "" ]; then
    ./testfairy-upload.sh ./android/app/build/outputs/apk/release/app-release.apk devtest "${COMMENTS}"
  fi
fi
