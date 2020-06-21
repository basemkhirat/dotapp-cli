#!/usr/bin/env node

var program = require("commander");
var fs = require("fs");
var request = require("request");
var unzip = require("unzipper");
var path = require("path");

/**
 * Validate the CLI
 */

program
	.version("0.1.1")
	.description("Generate dotapp framework project skeleton")
	.parse(process.argv);

if (program.args.length != 2) {
	console.error("Please specify project folder name");
	process.exit(1);
}

let [command] = program.args;

if (command == "new") {
	/**
	 * getting CLI args
	 * @type {string}
	 */

	var project_folder_path = path.join(process.cwd(), program.args[1]);

	if (fs.existsSync(project_folder_path)) {
		console.log(program.args[0] + " directory is already exist");
		process.exit();
	}

	/**
	 * Retrieving latest stable version
	 * @type {{headers: {User-Agent: string}, json: boolean}}
	 */

	var options = {
		headers: { "User-Agent": "https://api.github.com/meta" },
		json: true,
	};

	console.log("Checking the latest stable version");

	request.get(
		"https://api.github.com/repos/basemkhirat/dotapp-framework/releases/latest",
		options,
		function (error, response) {
			if (error) throw error;

			var url = response.body.zipball_url;
			var version = response.body.tag_name;

			console.log("Dotapp " + version + " is available!");

			console.log("Downloading from source");

			request
				.get(
					url,
					{ headers: { "User-Agent": "https://api.github.com/meta" } },
					function (error, response) {
						if (error) throw error;
					}
				)
				.pipe(fs.createWriteStream("/tmp/dotapp.zip"))

				.on("finish", function () {
					console.log("Extracting source files");

					var unzip_operation = unzip.Extract({ path: process.cwd() });

					fs.createReadStream("/tmp/dotapp.zip").pipe(unzip_operation);

					unzip_operation.on("close", function () {
						walkSync(process.cwd()).forEach(function (dir) {
							if (dir.startsWith("basemkhirat-dotapp-framework-")) {
								fs.rename(
									path.join(process.cwd(), dir),
									project_folder_path,
									function (err) {
										if (err) throw err;
										console.log("Dotapp is successfully installed!");
									}
								);
							}
						});
					});
				});
		}
	);
} else {
	console.log("Invalid command " + program.args[0]);
}

/**
 * Read sub directories
 * @param dir
 * @returns {Array}
 */
var walkSync = function (dir) {
	var files = fs.readdirSync(dir);

	dirs = [];

	files.forEach(function (file) {
		if (fs.statSync(path.join(dir, file)).isDirectory()) {
			dirs.push(file.replace(".js", ""));
		}
	});

	return dirs;
};
