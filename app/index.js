'use strict';

var SpireGenerator,
    yeoman  = require('yeoman-generator'),
    chalk   = require('chalk'),
    path    = require('path'),
    merge   = require('lodash').merge;

module.exports = SpireGenerator = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
  },

  init: function() {
    this.prompts = [];
    this.configPath = this.destinationPath('config.json');
    try {
      this.config = require(this.configPath);
    } catch (error) {
      this.config = {};
    }
  },

  askFor: function() {
    var done = this.async();

    this.log(chalk.magenta('You\'re using the fantastic adorable generator.'));

    var generateChoices = ['react', 'angular'];
    this.prompts.push({
      name: 'generate',
      type: 'list',
      message: 'What kind of app would you like to generate?',
      choices: generateChoices
    });
    this.prompts.push({
      name: 'nwjs',
      type: 'confirm',
      message: 'Is this an nw.js project?',
      default: false
    });
    this.prompts.push({
      name: 'projectName',
      type: 'input',
      message: 'What is the name of your project? (no spaces, or symbols)',
      default: process.cwd().split(path.sep).pop()
    });
    this.prompts.push({
      name: 'projectDesc',
      type: 'input',
      message: 'Enter a brief project description'
    });
    this.prompts.push({
      name: 'src',
      type: 'confirm',
      message: 'Do you want to generate the full src folder?',
      default: true
    });
    this.prompts.push({
      name: 'gulp',
      type: 'confirm',
      message: 'Do you want to generate the gulp files?',
      default: true
    });
    this.prompts.push({
      name: 'deployGh',
      type: 'confirm',
      message: 'Will this application be deployed to gh-pages?',
      default: false
    });

    var self = this;
    generateChoices.forEach(function(choice) {
      self.config[choice] = false;
    });
    this.prompt(this.prompts, function(answers) {
      var answer, question;
      for (question in answers) {
        answer = answers[question];
        self.config[question] = answer;
      }
      return done();
    });
  },

  projectfiles: function() {
    this.config[this.config.generate] = true;

    this.fs.copyTpl(this.templatePath('_bower.json'), this.destinationPath('bower.json'), this.config);
    this.fs.copyTpl(this.templatePath('_README.md'), this.destinationPath('README.md'), this.config);
    this.fs.copyTpl(this.templatePath('_eslintrc'), this.destinationPath('.eslintrc'), this.config);
    this.fs.copyTpl(this.templatePath('_sasslint.js'), this.destinationPath('.sasslint.js'), this.config);
    this.fs.copyTpl(this.templatePath('_webpack.config.js'), this.destinationPath('webpack.config.js'), this.config);
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
    this.fs.copy(this.templatePath('Gulpfile.js'), this.destinationPath('Gulpfile.js'));
    this.fs.copy(this.templatePath('Procfile'), this.destinationPath('Procfile'));
    this.fs.copy(this.templatePath('server.js'), this.destinationPath('server.js'));
    this.fs.copy(this.templatePath('mocks'), this.destinationPath('mocks'));
  },

  gulpfiles: function() {
    if (!this.config.gulp) { return; }
    this.fs.copyTpl(this.templatePath('Gulpfile.js'), this.destinationPath('Gulpfile.js'), this.config);
    this.fs.copyTpl(this.templatePath('_gulp_config.js'), this.destinationPath('gulp/config.js'));
    this.fs.copy(this.templatePath('gulp'), this.destinationPath('gulp'));
  },

  srcfiles: function() {
    if (!this.config.src) { return; }
    var pkgPath = this.templatePath('_package.json');
    var pkgDestPath = this.destinationPath('package.json');
    var pkg = this.fs.readJSON(pkgPath);

    function processPackage (file) {
      var contents = this.fs.readJSON(this.templatePath(`_${file}`));
      var destPath = this.destinationPath(file);
      pkg = merge(pkg, contents);
      this.fs.writeJSON(pkgDestPath, pkg);
      return destPath;
    }

    processPackage.bind(this, 'package.json')();

    this.fs.copyTpl(this.templatePath('_src_app_index.jade'), this.destinationPath('src/app/index.jade'), this.config);
    this.fs.copy(this.templatePath('src'), this.destinationPath('src'));

    if (this.config.angular) {
      processPackage.bind(this, 'package.angular.json')();

      this.fs.copy(this.templatePath('_angular/src/app'), this.destinationPath('src/app'));
      this.fs.copyTpl(this.templatePath('_angular_src/_src_app_components_data_data.js'), this.destinationPath('src/app/components/data/data.js'), this.config);
      this.fs.copyTpl(this.templatePath('_angular_src/_src_app_components_navbar_navbar.js'), this.destinationPath('src/app/components/navbar/navbar.js'), this.config);
      this.fs.copyTpl(this.templatePath('_angular_src/_src_app_index.js'), this.destinationPath('src/app/index.js'), this.config);
      this.fs.copyTpl(this.templatePath('_angular_src/_src_app_main_main.js'), this.destinationPath('src/app/main/main.js'), this.config);
      this.fs.copyTpl(this.templatePath('_angular_src/_src_app_main_things_things.js'), this.destinationPath('src/app/main/things/things.js'), this.config);
    }

    if (this.config.react) {
      processPackage.bind(this, 'package.react.json')();

      this.fs.copy(this.templatePath('_react/src/app'), this.destinationPath('src/app'));
      this.fs.copy(this.templatePath('_react/src/lib'), this.destinationPath('src/lib'));
    }

    console.log(this.config);
    if (this.config.deployGh) {
      processPackage.bind(this, 'package.deploy-gh.json')();

      this.fs.copyTpl(this.templatePath('_gulp_tasks_deploy-gh.js'), this.destinationPath('gulp/tasks/deploy-gh.js'));
    }

    var destPath = this.destinationPath('package.json');
    this.fs.copyTpl(destPath, destPath, this.config);
  },

  end: function() {
    this.options.callback = function() { return this.emit('allDone'); };
    this.on('allDone', function() {
      this.log(chalk.green('\n# Awesome. Everything generated just fine!'));
    });
  }

});
