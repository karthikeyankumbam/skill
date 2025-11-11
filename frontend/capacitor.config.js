const config = {
  appId: 'com.skilllink.app',
  appName: 'SkillLink',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development, you can use your backend URL
    // url: 'http://your-backend-url.com',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB' // or 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff"
    }
  }
};

module.exports = config;

