const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add PACKAGE_USAGE_STATS permission to AndroidManifest.xml
 */
const withScreenTimePermission = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add PACKAGE_USAGE_STATS permission if not already present
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const hasPermission = androidManifest['uses-permission'].some(
      (permission) =>
        permission.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );

    if (!hasPermission) {
      androidManifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      });
    }

    // Add tools namespace if not present
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });
};

module.exports = withScreenTimePermission;

