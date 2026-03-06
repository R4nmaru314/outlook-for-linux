const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
const { chmod } = require("node:fs/promises");

function getAppFileName(context) {
  const productFileName = context.packager.appInfo.productFilename;

  switch (context.electronPlatformName) {
    case "win32":
      return `${productFileName}.exe`;
    case "darwin":
      return `${productFileName}.app`;
    case "mas":
      return `${productFileName}.app`;
    case "linux":
      return context.packager.executableName;
    default:
      return "";
  }
}

exports.default = async function afterPack(context) {
  try {
    const appPath = `${context.appOutDir}/${getAppFileName(context)}`;
    await chmod(appPath, 0o755);
    await flipFuses(appPath, {
      version: FuseVersion.V1,
      [FuseV1Options.EnableCookieEncryption]: true,
    });
  } catch (error) {
    console.error("afterPack error: ", error);
    process.exit(1);
  }
};
