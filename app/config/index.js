const yargs = require("yargs");
const fs = require("node:fs");
const path = require("node:path");
const { ipcMain } = require("electron");
const logger = require("./logger");
const defaults = require("./defaults");

function getConfigFilePath(configPath) {
  return path.join(configPath, "config.json");
}

function getSystemConfigFilePath() {
  return "/etc/teams-for-linux/config.json";
}

function checkConfigFileExistence(configPath) {
  return fs.existsSync(getConfigFilePath(configPath));
}

function checkSystemConfigFileExistence() {
  return fs.existsSync(getSystemConfigFilePath());
}

function getConfigFile(configPath) {
  return require(getConfigFilePath(configPath));
}

function getSystemConfigFile() {
  return require(getSystemConfigFilePath());
}

function populateConfigObjectFromFile(configObject, configPath) {
  let systemConfig = {};
  let userConfig = {};
  let hasUserConfig = false;
  let hasSystemConfig = false;

  // First, try to load system-wide config
  if (checkSystemConfigFileExistence()) {
    try {
      systemConfig = getSystemConfigFile();
      hasSystemConfig = true;
      console.info(
        "System-wide config loaded from /etc/teams-for-linux/config.json"
      );
    } catch (e) {
      console.warn(
        "Error loading system-wide config file, ignoring:\n" + e.message
      );
    }
  }

  // Then, try to load user config (this takes precedence)
  if (checkConfigFileExistence(configPath)) {
    try {
      userConfig = getConfigFile(configPath);
      hasUserConfig = true;
    } catch (e) {
      configObject.configError = e.message;
      console.warn(
        "Error in user config file, using system config or defaults:\n" +
          configObject.configError
      );
    }
  }

function argv(configPath) {
	let configFile = getConfigFile(configPath);
	const missingConfig = configFile == null;
	configFile = configFile || {};
	let config = yargs
		.env(true)
		.config(configFile)
		.options({
			appIcon: {
				default: '',
				describe: 'Outlook app icon to show in the tray',
				type: 'string'
			},
			appIconType: {
				default: 'default',
				describe: 'Type of tray icon to be used',
				type: 'string',
				choices: ['default', 'light', 'dark']
			},
			appLogLevels: {
				default: 'error,warn',
				describe: 'Comma separated list of log levels (error,warn,info,debug)',
				type: 'string'
			},
			appTitle: {
				default: 'Microsoft Outlook',
				describe: 'A text to be suffixed with page title',
				type: 'string'
			},
			chromeUserAgent: {
				default: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`,
				describe: 'Google Chrome User Agent',
				type: 'string'
			},
			customCACertsFingerprints: {
				default: [],
				describe: 'Array of custom CA Certs Fingerprints to allow SSL unrecognized signer or self signed certificate',
				type: 'array'
			},
			customUserDir: {
				default: null,
				describe: 'Custom User Directory so that you can have multiple profiles',
				type: 'string'
			},
			clearStorage: {
				default: false,
				describe: 'Whether to clear the storage before creating the window or not',
				type: 'boolean'
			},
			clientCertPath: {
				default: '',
				describe: 'Custom Client Certs for corporate authentication (certificate must be in pkcs12 format)',
				type: 'string'
			},
			clientCertPassword: {
				default: '',
				describe: 'Custom Client Certs password for corporate authentication (certificate must be in pkcs12 format)',
				type: 'string'
			},
			closeAppOnCross: {
				default: false,
				describe: 'Close the app when clicking the close (X) cross',
				type: 'boolean'
			},
			defaultURLHandler: {
				default: '',
				describe: 'Default application to be used to open the HTTP URLs',
				type: 'string'
			},
			disableNotifications: {
				default: false,
				describe: 'A flag to disable all notifications',
				type: 'boolean'
			},
			disableNotificationSound: {
				default: false,
				describe: 'Disable notification sound',
				type: 'boolean'
			},
			disableNotificationWindowFlash: {
				default: false,
				describe: 'A flag indicates whether to disable window flashing when there is a notification',
				type: 'boolean'
			},
			partition: {
				default: 'persist:outlook-4-linux',
				describe: 'BrowserWindow webpreferences partition',
				type: 'string'
			},
			proxyServer: {
				default: null,
				describe: 'Proxy Server with format address:port',
				type: 'string'
			},
			menubar: {
				default: 'auto',
				describe: 'A value controls the menu bar behaviour',
				type: 'string',
				choices: ['auto', 'visible', 'hidden']
			},
			minimized: {
				default: false,
				describe: 'Start the application minimized',
				type: 'boolean'
			},
			ntlmV2enabled: {
				default: 'true',
				describe: 'Set enable-ntlm-v2 value',
				type: 'string'
			},
			url: {
				default: 'https://outlook.office.com/',
				describe: 'Microsoft Outlook URL',
				type: 'string'
			},
			webDebug: {
				default: false,
				describe: 'Enable debug at start',
				type: 'boolean'
			},
			onlineCheckMethod: {
				default: 'https',
				describe: 'Type of network test for checking online status.',
				type: 'string',
				choices: ['https', 'dns', 'native', 'none']
			}
		})
		.parse(process.argv.slice(1));

  return { yargsInstance, parsedConfig };
}

function checkUsedDeprecatedValues(yargsInstance, configObject, config) {
  // yargs v18: getDeprecatedOptions() must be called on the instance
  const deprecatedOptions = yargsInstance.getDeprecatedOptions();
  const warnings = [];

  for (const option in deprecatedOptions) {
    if (option in configObject.configFile) {
      const deprecatedWarningMessage = `Option \`${option}\` is deprecated and will be removed in future version. \n ${deprecatedOptions[option]}.`;
      console.warn(deprecatedWarningMessage);
      warnings.push(deprecatedWarningMessage);
    } else {
      console.debug(`all good with ${option} you aren't using them`);
    }
  }

  // Accumulate all warnings instead of overwriting
  if (warnings.length > 0) {
    config["warnings"] = warnings;
  }
}

function argv(configPath, appVersion) {
  const configObject = {
    configFile: {},
    configError: null,
    configWarning: null,
    isConfigFile: false,
  };

  populateConfigObjectFromFile(configObject, configPath);

  // yargs v18: extractYargConfig now returns both the instance and parsed config
  const { yargsInstance, parsedConfig: config } = extractYargConfig(configObject, appVersion);

  if (configObject.configError) {
    config["error"] = configObject.configError;
  }

  // Pass yargs instance to access getDeprecatedOptions() in v18
  checkUsedDeprecatedValues(yargsInstance, configObject, config);

  if (configObject.isConfigFile && config.watchConfigFile) {
    fs.watch(getConfigFilePath(configPath), (event, filename) => {
      console.info(
        `Config file ${filename} changed ${event}. Relaunching app...`
      );
      ipcMain.emit("config-file-changed");
    });
  }

  // Track whether disableGpu was explicitly set via CLI or config file
  // This allows Wayland detection to use smart defaults while respecting user preferences
  const wasSetInCli = process.argv.some(arg => arg.startsWith('--disableGpu'));
  const wasSetInFile = configObject.configFile && "disableGpu" in configObject.configFile;
  config.disableGpuExplicitlySet = wasSetInCli || wasSetInFile;

  logger.init(config.logConfig);

  console.info("configPath:", configPath);
  console.debug("configFile:", configObject.configFile);

  return config;
}

exports = module.exports = argv;
