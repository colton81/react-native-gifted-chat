// Learn more https://docs.expo.io/guides/customizing-metro
/** biome-ignore-all lint/style/noCommonJs: <explanation> */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.blockList = [
	...Array.from(config.resolver.blockList ?? []),
	new RegExp(path.resolve("..", "node_modules", "react")),
	new RegExp(path.resolve("..", "node_modules", "react-native")),
	new RegExp(path.resolve("..", "node_modules", "@react-navigation")),
];

config.resolver.extraNodeModules = {
	get: (target, name) => {
		// console.log(`example/metro name: ${name}`, Object.prototype.hasOwnProperty.call(target, name))
		if (Object.hasOwn(target, name)) {
			return target[name];
		}

		if (name === "react-native-gifted-chat") {
			return path.join(process.cwd(), "../src");
		}

		return path.join(process.cwd(), `node_modules/${name}`);
	},
};
config.resolver.nodeModulesPaths = [
	path.resolve(__dirname, "./node_modules"),
	path.resolve(__dirname, "../node_modules"),
];
config.watchFolders = [path.resolve(__dirname, "../src")];
module.exports = config;
