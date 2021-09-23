# react-native run-ios --configuration Release
# will do a release build and deploy it to simulator or device
# Alternatively, in Xcode we can do Product > Build (to generate an .xcarchive) followed by Product > Archive (to generate a signed .ipa)
# However we want to script it:

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
  echo Switching to Firebase Production environment for iOS
  cp -rf firebase_config/prod/GoogleService-Info.plist ios
else
  export ENVFILE=.env.test
  echo TEST Build
  echo Switching to Firebase Test environment for iOS
  cp -rf firebase_config/test/GoogleService-Info.plist ios
fi

rm -rf ./ios/build/Build/Outputs/*.ipa
rm -rf ./ios/build/Build/Products/ccf.xcarchive
npm run build
cd ios

# Archive, creates ./ios/build/Build/Products/ccf.xcarchive
xcodebuild archive \
  -allowProvisioningUpdates \
  -workspace ccf.xcworkspace \
  -configuration Release \
  -scheme ccf \
  -derivedDataPath build \
  -archivePath build/Build/Products/ccf.xcarchive

# Export Archive, creates ./ios/build/Build/Outputs/Competence.ipa
xcodebuild -exportArchive \
  -archivePath ./build/Build/Products/ccf.xcarchive \
  -exportPath ./build/Build/Outputs \
  -exportOptionsPlist ../build-ios.plist \
  -allowProvisioningUpdates

cd ..
set -o allexport; source $ENVFILE; set +o allexport # expose all env file variables
cp ./ios/build/Build/Outputs/Competence.ipa ./ios/build/Build/Outputs/Competence"${APP_VERSION}".ipa
ls -l ./ios/build/Build/Outputs/*.ipa
ls -l ./ios/build/Build/Outputs/Competence"${APP_VERSION}".ipa >> build.log

# Upload to testfairy
COMMENTS=$(cat build-comments.txt)
if [ "$ENV" == "t" ]; then
  ./testfairy-upload.sh ./ios/build/Build/Outputs/Competence.ipa beta_ios "${COMMENTS}"
elif [ "$ENV" == "d" ] || [ "$ENV" == "" ]; then
  ./testfairy-upload.sh ./ios/build/Build/Outputs/Competence.ipa devtest "${COMMENTS}"
else
  cp -rf firebase_config/test/GoogleService-Info.plist ios # reset back to test config for firebase
fi
