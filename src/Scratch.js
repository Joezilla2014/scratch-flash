/*
 * Scratch Project Editor and Player
 * Copyright (C) 2014 Massachusetts Institute of Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General License for more details.
 *
 * You should have received a copy of the GNU General License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

// Scratch.as
// John Maloney, September 2009
//
// This is the top-level application.

import './blocks/*';

import './blocks/StringUtil.js';

import './extensions/ExtensionDevManager.js';
import './extensions/ExtensionManager.js';

import '.../phaser/src/display/index.js';
import '.../phaser/src/events/index.js';
//import flash.external.ExternalInterface;
import '.../phaser/src/geom/point/index.js';
import '.../phaser/src/geom/rectangle/index.js';
//import flash.net.FileFilter;
//import flash.net.FileReference;
//import flash.net.FileReferenceList;
//import flash.net.LocalConnection;
//import flash.net.SharedObject;
//import flash.net.URLLoader;
//import flash.net.URLLoaderDataFormat;
//import flash.net.URLRequest;
//import flash.system.*;
//import flash.text.*;
import '.../phaser/src/utils/index.js';

import './interpreter/*';

import './logging/Log.js';
import './logging/LogEntry.js';
import './logging/LogLevel.js';

//import mx.utils.URLUtil;

import './render3d/DisplayObjectContainerIn3D.js';

import './scratch/*';

import './svgeditor/tools/SVGTool.js';

import './translation/*';

import './ui/*';
import './ui/media/*';
import './ui/parts/*';

import './uiwidgets/*';

import './util/*';

import './watchers/ListWatcher.js';

(function() {
  var Program = {};
  Program["Scratch"] = function(module, exports) {
    var Scratch;
    module.inject = function() {
      Scratch = module.import('', 'Scratch');
    };

    var Scratch = function() {
      this.$init();
      SVGTool.setStage(stage);
      loaderInfo.uncaughtErrorEvents.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, this.uncaughtErrorHandler);
      Scratch.app = this;

      // This one must finish before most other queries can start, so do it separately
      this.determineJSAccess();
    };

    Scratch.prototype = Object.create(Sprite.prototype);

    Scratch.versionString = null;
    Scratch.app = null;
    Scratch.fixFileName = function(s) {
      // Replace illegal characters in the given string with dashes.
      var illegal = '\\/:*?"<>|%';
      var result = '';
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if ((i == 0) && ('.' == ch)) ch = '-'; // don't allow leading period
        result += (illegal.indexOf(ch) > -1) ? '-' : ch;
      }
      return result;
    };
    Scratch.loadSingleFile = function(fileLoaded, filter) {
      filter = AS3JS.Utils.getDefaultValue(filter, null);

      function fileSelected(event) {
        if (fileList.fileList.length > 0) {
          var file = FileReference(fileList.fileList[0]);
          file.addEventListener(Event.COMPLETE, fileLoaded);
          file.load();
        }
      }

      var fileList = new FileReferenceList();
      fileList.addEventListener(Event.SELECT, fileSelected);
      try {
        // Ignore the exception that happens when you call browse() with the file browser open
        fileList.browse(filter != null ? [filter] : null);
      } catch (e) {}
    };

    Scratch.$cinit = function() {
      Scratch.versionString = 'v461.2';
      Scratch.app = null;

    };

    Scratch.prototype.get_usesUserNameBlock = function() {
      return _usesUserNameBlock;
    };
    Scratch.prototype.set_usesUserNameBlock = function(value) {
      _usesUserNameBlock = value;
      this.stagePart.refresh();
    };
    Scratch.prototype.$init = function() {
      this.render3D = null;
      this.runtime = null;
      this.interp = null;
      this.extensionManager = null;
      this.server = null;
      this.gh = null;
      this.viewedObject = null;
      this.playerBG = null;
      this.palette = null;
      this.scriptsPane = null;
      this.stagePane = null;
      this.mediaLibrary = null;
      this.lp = null;
      this.cameraDialog = null;
      this.libraryPart = null;
      this.topBarPart = null;
      this.stagePart = null;
      this.tabsPart = null;
      this.scriptsPart = null;
      this.imagesPart = null;
      this.soundsPart = null;
      this.logger = new Log(16);
      this.pendingExtensionURLs = null;
      this.debugRect = null;
      this.modalOverlay = null;
      this.originalProj = null;
      this.revertUndo = null;
    };
    Scratch.prototype.hostProtocol = 'http';
    Scratch.prototype.editMode = false;
    Scratch.prototype.isOffline = false;
    Scratch.prototype.isSmallPlayer = false;
    Scratch.prototype.stageIsContracted = false;
    Scratch.prototype.isIn3D = false;
    Scratch.prototype.render3D = null;
    Scratch.prototype.isArmCPU = false;
    Scratch.prototype.jsEnabled = false;
    Scratch.prototype.ignoreResize = false;
    Scratch.prototype.isExtensionDevMode = false;
    Scratch.prototype.isMicroworld = false;
    Scratch.prototype.presentationScale = 0;
    Scratch.prototype.runtime = null;
    Scratch.prototype.interp = null;
    Scratch.prototype.extensionManager = null;
    Scratch.prototype.server = null;
    Scratch.prototype.gh = null;
    Scratch.prototype.projectID = '';
    Scratch.prototype.projectOwner = '';
    Scratch.prototype.projectIsPrivate = false;
    Scratch.prototype.oldWebsiteURL = '';
    Scratch.prototype.loadInProgress = false;
    Scratch.prototype.debugOps = false;
    Scratch.prototype.debugOpCmd = '';
    Scratch.prototype.autostart = false;
    Scratch.prototype.viewedObject = null;
    Scratch.prototype.lastTab = 'scripts';
    Scratch.prototype.wasEdited = false;
    Scratch.prototype.languageChanged = false;
    Scratch.prototype.playerBG = null;
    Scratch.prototype.palette = null;
    Scratch.prototype.scriptsPane = null;
    Scratch.prototype.stagePane = null;
    Scratch.prototype.mediaLibrary = null;
    Scratch.prototype.lp = null;
    Scratch.prototype.cameraDialog = null;
    Scratch.prototype.libraryPart = null;
    Scratch.prototype.topBarPart = null;
    Scratch.prototype.stagePart = null;
    Scratch.prototype.tabsPart = null;
    Scratch.prototype.scriptsPart = null;
    Scratch.prototype.imagesPart = null;
    Scratch.prototype.soundsPart = null;
    Scratch.prototype.tipsBarClosedWidth = 17;
    Scratch.prototype.logger = null;
    Scratch.prototype.determineJSAccess = function() {
      if (this.externalInterfaceAvailable()) {
        try {
          this.externalCall('function(){return true;}', this.jsAccessDetermined);
          return; // wait for callback
        } catch (e) {}
      }
      this.jsAccessDetermined(false);
    };
    Scratch.prototype.jsAccessDetermined = function(result) {
      this.jsEnabled = result;
      this.initialize();
    };
    Scratch.prototype.initialize = function() {
      this.isOffline = !URLUtil.isHttpURL(loaderInfo.url);
      this.hostProtocol = URLUtil.getProtocol(loaderInfo.url);

      this.isExtensionDevMode = (loaderInfo.parameters['extensionDevMode'] == 'true');
      this.isMicroworld = (loaderInfo.parameters['microworldMode'] == 'true');

      this.checkFlashVersion();
      this.initServer();

      stage.align = StageAlign.TOP_LEFT;
      stage.scaleMode = StageScaleMode.NO_SCALE;
      stage.frameRate = 30;

      if (stage.hasOwnProperty('color')) {
        // Stage doesn't have a color property on Air 2.6, and Linux throws if you try to set it anyway.
        stage['color'] = CSS.backgroundColor();
      }

      Block.setFonts(10, 9, true, 0); // default font sizes
      Block.MenuHandlerFunction = BlockMenus.BlockMenuHandler;
      CursorTool.init(this);
      Scratch.app = this;

      this.stagePane = this.getScratchStage();
      this.gh = new GestureHandler(this, (loaderInfo.parameters['inIE'] == 'true'));
      this.initInterpreter();
      this.initRuntime();
      this.initExtensionManager();
      Translator.initializeLanguageList();

      this.playerBG = new Shape(); // create, but don't add
      this.addParts();

      this.server.getSelectedLang(Translator.setLanguageValue);

      stage.addEventListener(MouseEvent.MOUSE_DOWN, this.gh.mouseDown);
      stage.addEventListener(MouseEvent.MOUSE_MOVE, this.gh.mouseMove);
      stage.addEventListener(MouseEvent.MOUSE_UP, this.gh.mouseUp);
      stage.addEventListener(MouseEvent.MOUSE_WHEEL, this.gh.mouseWheel);
      stage.addEventListener('rightClick', this.gh.rightMouseClick);

      stage.addEventListener(KeyboardEvent.KEY_UP, this.runtime.keyUp);
      stage.addEventListener(KeyboardEvent.KEY_DOWN, this.keyDown); // to handle escape key
      stage.addEventListener(Event.ENTER_FRAME, this.step);
      stage.addEventListener(Event.RESIZE, this.onResize);

      this.setEditMode(this.startInEditMode());

      // install project before calling fixLayout()
      if (this.editMode) this.runtime.installNewProject();
      else this.runtime.installEmptyProject();

      this.fixLayout();
      //Analyze.collectAssets(0, 119110);
      //Analyze.checkProjects(56086, 64220);
      //Analyze.countMissingAssets();

      this.handleStartupParameters();
    };
    Scratch.prototype.handleStartupParameters = function() {
      this.setupExternalInterface(false);
      this.jsEditorReady();
    };
    Scratch.prototype.setupExternalInterface = function(oldWebsitePlayer) {
      if (!this.jsEnabled) return;

      this.addExternalCallback('ASloadExtension', this.extensionManager.loadRawExtension);
      this.addExternalCallback('ASextensionCallDone', this.extensionManager.callCompleted);
      this.addExternalCallback('ASextensionReporterDone', this.extensionManager.reporterCompleted);
      this.addExternalCallback('AScreateNewProject', this.createNewProjectScratchX);

      if (this.isExtensionDevMode) {
        this.addExternalCallback('ASloadGithubURL', this.loadGithubURL);
        this.addExternalCallback('ASloadBase64SBX', this.loadBase64SBX);
        this.addExternalCallback('ASsetModalOverlay', this.setModalOverlay);
      }
    };
    Scratch.prototype.jsEditorReady = function() {
      if (this.jsEnabled) {
        this.externalCall('JSeditorReady', function(success) {
          if (!success) this.jsThrowError('Calling JSeditorReady() failed.');
        });
      }
    };
    Scratch.prototype.loadSingleGithubURL = function(url) {
      url = StringUtil.trim(unescape(url));

      function handleComplete(e) {
        this.runtime.installProjectFromData(sbxLoader.data);
        if (StringUtil.trim(this.projectName()).length == 0) {
          var newProjectName = url;
          var index = newProjectName.indexOf('?');
          if (index > 0) newProjectName = newProjectName.slice(0, index);
          index = newProjectName.lastIndexOf('/');
          if (index > 0) newProjectName = newProjectName.substr(index + 1);
          index = newProjectName.lastIndexOf('.sbx');
          if (index > 0) newProjectName = newProjectName.slice(0, index);
          this.setProjectName(newProjectName);
        }
      }

      function handleError(e) {
        this.jsThrowError('Failed to load SBX: ' + e.toString());
      }

      var fileExtension = url.substr(url.lastIndexOf('.')).toLowerCase();
      if (fileExtension == '.js') {
        this.externalCall('ScratchExtensions.loadExternalJS', null, url);
        return;
      }

      // Otherwise assume it's a project (SB2, SBX, etc.)
      this.loadInProgress = true;
      var request = new URLRequest(url);
      var sbxLoader = new URLLoader(request);
      sbxLoader.dataFormat = URLLoaderDataFormat.BINARY;
      sbxLoader.addEventListener(Event.COMPLETE, handleComplete);
      sbxLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, handleError);
      sbxLoader.addEventListener(IOErrorEvent.IO_ERROR, handleError);
      sbxLoader.load(request);
    };
    Scratch.prototype.pendingExtensionURLs = null;
    Scratch.prototype.loadGithubURL = function(urlOrArray) {
      if (!this.isExtensionDevMode) return;

      var url;
      var urlArray = urlOrArray as Array;
      if (urlArray) {
        var urlCount = urlArray.length;
        var extensionURLs = [];
        var projectURL;
        var index;

        // Filter URLs: allow at most one project file, and wait until it loads before loading extensions.
        for (index = 0; index < urlCount; ++index) {
          url = StringUtil.trim(unescape(urlArray[index]));
          if (StringUtil.endsWith(url.toLowerCase(), '.js')) {
            extensionURLs.push(url);
          } else if (url.length > 0) {
            if (projectURL) {
              this.jsThrowError("Ignoring extra project URL: " + projectURL);
            }
            projectURL = StringUtil.trim(url);
          }
        }
        if (projectURL) {
          this.pendingExtensionURLs = extensionURLs;
          this.loadSingleGithubURL(projectURL);
          // warning will be shown later
        } else {
          urlCount = extensionURLs.length;
          for (index = 0; index < urlCount; ++index) {
            this.loadSingleGithubURL(extensionURLs[index]);
          }
          this.externalCall('JSshowWarning');
        }
      } else {
        url = urlOrArray as String;
        this.loadSingleGithubURL(url);
        this.externalCall('JSshowWarning');
      }
    };
    Scratch.prototype.loadBase64SBX = function(base64) {
      var sbxData = Base64Encoder.decode(base64);
      Scratch.app.setProjectName('');
      this.runtime.installProjectFromData(sbxData);
    };
    Scratch.prototype.initTopBarPart = function() {
      this.topBarPart = new TopBarPart(this);
    };
    Scratch.prototype.initScriptsPart = function() {
      this.scriptsPart = new ScriptsPart(this);
    };
    Scratch.prototype.initImagesPart = function() {
      this.imagesPart = new ImagesPart(this);
    };
    Scratch.prototype.initInterpreter = function() {
      this.interp = new Interpreter(this);
    };
    Scratch.prototype.initRuntime = function() {
      this.runtime = new ScratchRuntime(this, this.interp);
    };
    Scratch.prototype.initExtensionManager = function() {
      if (this.isExtensionDevMode) {
        this.extensionManager = new ExtensionDevManager(this);
      } else {
        this.extensionManager = new ExtensionManager(this);
      }
    };
    Scratch.prototype.initServer = function() {
      this.server = new Server();
    };
    Scratch.prototype.showTip = function(tipName) {};
    Scratch.prototype.closeTips = function() {};
    Scratch.prototype.reopenTips = function() {};
    Scratch.prototype.tipsWidth = function() {
      return 0;
    };
    Scratch.prototype.startInEditMode = function() {
      return this.isOffline || this.isExtensionDevMode;
    };
    Scratch.prototype.getMediaLibrary = function(type, whenDone) {
      return new MediaLibrary(this, type, whenDone);
    };
    Scratch.prototype.getMediaPane = function(app, type) {
      return new MediaPane(app, type);
    };
    Scratch.prototype.getScratchStage = function() {
      return new ScratchStage();
    };
    Scratch.prototype.getPaletteBuilder = function() {
      return new PaletteBuilder(this);
    };
    Scratch.prototype.uncaughtErrorHandler = function(event) {
      if (event.error is Error) {
        var error = event.error as Error;
        this.logException(error);
      } else if (event.error is ErrorEvent) {
        var errorEvent = event.error as ErrorEvent;
        this.log(LogLevel.ERROR, errorEvent.toString());
      }
    };
    Scratch.prototype.log = function(severity, messageKey, extraData) {
      extraData = AS3JS.Utils.getDefaultValue(extraData, null);
      return this.logger.log(severity, messageKey, extraData);
    };
    Scratch.prototype.logException = function(e) {
      this.log(LogLevel.ERROR, e.toString());
    };
    Scratch.prototype.logMessage = function(msg, extra_data) {
      extra_data = AS3JS.Utils.getDefaultValue(extra_data, null);
      this.log(LogLevel.ERROR, msg, extra_data);
    };
    Scratch.prototype.loadProjectFailed = function() {
      this.loadInProgress = false;
    };
    Scratch.prototype.jsThrowError = function(s) {
      // Throw the given string as an error in the browser. Errors on the production site are logged.
      var errorString = 'SWF Error: ' + s;
      this.log(LogLevel.WARNING, errorString);
      if (this.jsEnabled) {
        this.externalCall('JSthrowError', null, errorString);
      }
    };
    Scratch.prototype.checkFlashVersion = function() {
      SCRATCH::allow3d {
        if (Capabilities.playerType != "Desktop" || Capabilities.version.indexOf('IOS') === 0) {
          var versionString = Capabilities.version.substr(Capabilities.version.indexOf(' ') + 1);
          var versionParts = versionString.split(',');
          var majorVersion = parseInt(versionParts[0]);
          var minorVersion = parseInt(versionParts[1]);
          if ((majorVersion > 11 || (majorVersion == 11 && minorVersion >= 7)) && !this.isArmCPU && Capabilities.cpuArchitecture == 'x86') {
            this.render3D = new DisplayObjectContainerIn3D();
            this.render3D.setStatusCallback(this.handleRenderCallback);
            return;
          }
        }
      }

      this.render3D = null;
    };
    Scratch.prototype.handleRenderCallback = function(enabled) {
      if (!enabled) {
        this.go2D();
        this.render3D = null;
      } else {
        for (var i = 0; i < this.stagePane.numChildren; ++i) {
          var spr = (this.stagePane.getChildAt(i) as ScratchSprite);
          if (spr) {
            spr.clearCachedBitmap();
            spr.updateCostume();
            spr.applyFilters();
          }
        }
        this.stagePane.clearCachedBitmap();
        this.stagePane.updateCostume();
        this.stagePane.applyFilters();
      }
    };
    Scratch.prototype.clearCachedBitmaps = function() {
      for (var i = 0; i < this.stagePane.numChildren; ++i) {
        var spr = (this.stagePane.getChildAt(i) as ScratchSprite);
        if (spr) spr.clearCachedBitmap();
      }
      this.stagePane.clearCachedBitmap();

      // unsupported technique that seems to force garbage collection
      try {
        new LocalConnection().connect('foo');
        new LocalConnection().connect('foo');
      } catch (e: Error) {}
    };
    Scratch.prototype.go3D = function() {
      if (!this.render3D || this.isIn3D) return;

      var i = this.stagePart.getChildIndex(this.stagePane);
      this.stagePart.removeChild(this.stagePane);
      this.render3D.setStage(this.stagePane, this.stagePane.penLayer);
      this.stagePart.addChildAt(this.stagePane, i);
      this.isIn3D = true;
    };
    Scratch.prototype.go2D = function() {
      if (!this.render3D || !this.isIn3D) return;

      var i = this.stagePart.getChildIndex(this.stagePane);
      this.stagePart.removeChild(this.stagePane);
      this.render3D.setStage(null, null);
      this.stagePart.addChildAt(this.stagePane, i);
      this.isIn3D = false;
      for (i = 0; i < this.stagePane.numChildren; ++i) {
        var spr = (this.stagePane.getChildAt(i) as ScratchSprite);
        if (spr) {
          spr.clearCachedBitmap();
          spr.updateCostume();
          spr.applyFilters();
        }
      }
      this.stagePane.clearCachedBitmap();
      this.stagePane.updateCostume();
      this.stagePane.applyFilters();
    };
    Scratch.prototype.debugRect = null;
    Scratch.prototype.showDebugRect = function(r) {
      // Used during debugging...
      var p = this.stagePane.localToGlobal(new Point(0, 0));
      if (!this.debugRect) this.debugRect = new Shape();
      var g = this.debugRect.graphics;
      g.clear();
      if (r) {
        g.lineStyle(2, 0xFFFF00);
        g.drawRect(p.x + r.x, p.y + r.y, r.width, r.height);
        addChild(this.debugRect);
      }
    };
    Scratch.prototype.strings = function() {
      return [
        'a copy of the project file on your computer.',
        'Project not saved!', 'Save now', 'Not saved; project did not load.',
        'Save project?', 'Don\'t save',
        'Save now', 'Saved',
        'Revert', 'Undo Revert', 'Reverting...',
        'Throw away all changes since opening this project?',
      ];
    };
    Scratch.prototype.viewedObj = function() {
      return this.viewedObject;
    };
    Scratch.prototype.stageObj = function() {
      return this.stagePane;
    };
    Scratch.prototype.projectName = function() {
      return this.stagePart.projectName();
    };
    Scratch.prototype.highlightSprites = function(sprites) {
      this.libraryPart.highlight(sprites);
    };
    Scratch.prototype.refreshImageTab = function(fromEditor) {
      this.imagesPart.refresh(fromEditor);
    };
    Scratch.prototype.refreshSoundTab = function() {
      this.soundsPart.refresh();
    };
    Scratch.prototype.selectCostume = function() {
      this.imagesPart.selectCostume();
    };
    Scratch.prototype.selectSound = function(snd) {
      this.soundsPart.selectSound(snd);
    };
    Scratch.prototype.clearTool = function() {
      CursorTool.setTool(null);
      this.topBarPart.clearToolButtons();
    };
    Scratch.prototype.tabsRight = function() {
      return this.tabsPart.x + this.tabsPart.w;
    };
    Scratch.prototype.enableEditorTools = function(flag) {
      this.imagesPart.editor.enableTools(flag);
    };
    Scratch.prototype.updatePalette = function(clearCaches) {
      clearCaches = AS3JS.Utils.getDefaultValue(clearCaches, true);
      // Note: updatePalette() is called after changing variable, list, or procedure
      // definitions, so this is a convenient place to clear the interpreter's caches.
      if (this.isShowing(this.scriptsPart)) this.scriptsPart.updatePalette();
      if (clearCaches) this.runtime.clearAllCaches();
    };
    Scratch.prototype.setProjectName = function(s) {
      for (;;) {
        if (StringUtil.endsWith(s, '.sb')) s = s.slice(0, -3);
        else if (StringUtil.endsWith(s, '.sb2')) s = s.slice(0, -4);
        else if (StringUtil.endsWith(s, '.sbx')) s = s.slice(0, -4);
        else break;
      }
      this.stagePart.setProjectName(s);
    };
    Scratch.prototype.wasEditing = false;
    Scratch.prototype.setPresentationMode = function(enterPresentation) {
      if (this.stagePart.isInPresentationMode() != enterPresentation) {
        this.presentationModeWasChanged(enterPresentation);
      }
    };
    Scratch.prototype.presentationModeWasChanged = function(enterPresentation) {
      if (enterPresentation) {
        this.wasEditing = this.editMode;
        if (this.wasEditing) {
          this.setEditMode(false);
          if (this.jsEnabled) this.externalCall('tip_bar_api.hide');
        }
      } else {
        if (this.wasEditing) {
          this.setEditMode(true);
          if (this.jsEnabled) this.externalCall('tip_bar_api.show');
        }
      }
      if (this.isOffline) {
        stage.displayState = enterPresentation ? StageDisplayState.FULL_SCREEN_INTERACTIVE : StageDisplayState.NORMAL;
      }
      for each(var o in this.stagePane.allObjects()) o.applyFilters();

      if (this.lp) this.fixLoadProgressLayout();
      this.stagePart.presentationModeWasChanged(enterPresentation);
      this.stagePane.updateCostume();
      SCRATCH::allow3d {
        if (this.isIn3D) this.render3D.onStageResize();
      }
    };
    Scratch.prototype.keyDown = function(evt) {
      // Escape stops drag operations
      if (!evt.shiftKey && evt.charCode == 27) {
        this.gh.escKeyDown();
      }
      // Escape exists presentation mode.
      else if ((evt.charCode == 27) && this.stagePart.isInPresentationMode()) {
        this.setPresentationMode(false);
      }
      // Handle enter key
      //    else if(evt.keyCode == 13 && !stage.focus) {
      //      stagePart.playButtonPressed(null);
      //      evt.preventDefault();
      //      evt.stopImmediatePropagation();
      //    }
      // Handle ctrl-m and toggle 2d/3d mode
      else if (evt.ctrlKey && evt.charCode == 109) {
        SCRATCH::allow3d {
          this.isIn3D ? this.go2D() : this.go3D();
        }
        evt.preventDefault();
        evt.stopImmediatePropagation();
      } else {
        this.runtime.keyDown(evt);
      }
    };
    Scratch.prototype.setSmallStageMode = function(flag) {
      this.stageIsContracted = flag;
      this.stagePart.updateRecordingTools();
      this.fixLayout();
      this.libraryPart.refresh();
      this.tabsPart.refresh();
      this.stagePane.applyFilters();
      this.stagePane.updateCostume();
    };
    Scratch.prototype.projectLoaded = function() {
      this.removeLoadProgressBox();
      System.gc();
      if (this.autostart) this.runtime.startGreenFlags(true);
      this.loadInProgress = false;
      this.saveNeeded = false;

      // translate the blocks of the newly loaded project
      for each(var o in this.stagePane.allObjects()) {
        o.updateScriptsAfterTranslation();
      }

      if (this.jsEnabled && this.isExtensionDevMode) {
        if (this.pendingExtensionURLs) {
          this.loadGithubURL(this.pendingExtensionURLs);
          this.pendingExtensionURLs = null;
        }
        this.externalCall('JSprojectLoaded');
      }
    };
    Scratch.prototype.resetPlugin = function(whenDone) {
      if (this.jsEnabled) {
        this.externalCall('ScratchExtensions.resetPlugin');
      }
      if (whenDone != null) {
        whenDone();
      }
    };
    Scratch.prototype.step = function(e) {
      // Step the runtime system and all UI components.
      CachedTimer.clearCachedTimer();
      this.gh.step();
      this.runtime.stepRuntime();
      Transition.step(null);
      this.stagePart.step();
      this.libraryPart.step();
      this.scriptsPart.step();
      this.imagesPart.step();
    };
    Scratch.prototype.updateSpriteLibrary = function(sortByIndex) {
      sortByIndex = AS3JS.Utils.getDefaultValue(sortByIndex, false);
      this.libraryPart.refresh()
    };
    Scratch.prototype.updateTopBar = function() {
      this.topBarPart.refresh();
    };
    Scratch.prototype.threadStarted = function() {
      this.stagePart.threadStarted()
    };
    Scratch.prototype.selectSprite = function(obj) {
      if (this.isShowing(this.imagesPart)) this.imagesPart.editor.shutdown();
      if (this.isShowing(this.soundsPart)) this.soundsPart.editor.shutdown();
      this.viewedObject = obj;
      this.libraryPart.refresh();
      this.tabsPart.refresh();
      if (this.isShowing(this.imagesPart)) {
        this.imagesPart.refresh();
      }
      if (this.isShowing(this.soundsPart)) {
        this.soundsPart.currentIndex = 0;
        this.soundsPart.refresh();
      }
      if (this.isShowing(this.scriptsPart)) {
        this.scriptsPart.updatePalette();
        this.scriptsPane.viewScriptsFor(obj);
        this.scriptsPart.updateSpriteWatermark();
      }
    };
    Scratch.prototype.setTab = function(tabName) {
      if (this.isShowing(this.imagesPart)) this.imagesPart.editor.shutdown();
      if (this.isShowing(this.soundsPart)) this.soundsPart.editor.shutdown();
      this.hide(this.scriptsPart);
      this.hide(this.imagesPart);
      this.hide(this.soundsPart);
      if (!this.editMode) return;
      if (tabName == 'images') {
        this.show(this.imagesPart);
        this.imagesPart.refresh();
      } else if (tabName == 'sounds') {
        this.soundsPart.refresh();
        this.show(this.soundsPart);
      } else if (tabName && (tabName.length > 0)) {
        tabName = 'scripts';
        this.scriptsPart.updatePalette();
        this.scriptsPane.viewScriptsFor(this.viewedObject);
        this.scriptsPart.updateSpriteWatermark();
        this.show(this.scriptsPart);
      }
      this.show(this.tabsPart);
      this.show(this.stagePart); // put stage in front
      this.tabsPart.selectTab(tabName);
      this.lastTab = tabName;
      if (this.saveNeeded) this.setSaveNeeded(true); // save project when switching tabs, if needed (but NOT while loading!)
    };
    Scratch.prototype.installStage = function(newStage) {
      var showGreenflagOverlay = this.shouldShowGreenFlag();
      this.stagePart.installStage(newStage, showGreenflagOverlay);
      this.selectSprite(newStage);
      this.libraryPart.refresh();
      this.setTab('scripts');
      this.scriptsPart.resetCategory();
      this.wasEdited = false;
    };
    Scratch.prototype.shouldShowGreenFlag = function() {
      return !(this.autostart || this.editMode);
    };
    Scratch.prototype.addParts = function() {
      this.initTopBarPart();
      this.stagePart = this.getStagePart();
      this.libraryPart = this.getLibraryPart();
      this.tabsPart = new TabsPart(this);
      this.initScriptsPart();
      this.initImagesPart();
      this.soundsPart = new SoundsPart(this);
      addChild(this.topBarPart);
      addChild(this.stagePart);
      addChild(this.libraryPart);
      addChild(this.tabsPart);
    };
    Scratch.prototype.getStagePart = function() {
      return new StagePart(this);
    };
    Scratch.prototype.getLibraryPart = function() {
      return new LibraryPart(this);
    };
    Scratch.prototype.fixExtensionURL = function(javascriptURL) {
      return javascriptURL;
    };
    Scratch.prototype.setEditMode = function(newMode) {
      Menu.removeMenusFrom(stage);
      this.editMode = newMode;
      if (this.editMode) {
        this.interp.showAllRunFeedback();
        this.hide(this.playerBG);
        this.show(this.topBarPart);
        this.show(this.libraryPart);
        this.show(this.tabsPart);
        this.setTab(this.lastTab);
        this.stagePart.hidePlayButton();
        this.runtime.edgeTriggersEnabled = true;
      } else {
        addChildAt(this.playerBG, 0); // behind everything
        this.playerBG.visible = false;
        this.hide(this.topBarPart);
        this.hide(this.libraryPart);
        this.hide(this.tabsPart);
        this.setTab(null); // hides scripts, images, and sounds
      }
      this.stagePane.updateListWatchers();
      this.show(this.stagePart); // put stage in front
      this.fixLayout();
      this.stagePart.refresh();
    };
    Scratch.prototype.hide = function(obj) {
      if (obj.parent) obj.parent.removeChild(obj)
    };
    Scratch.prototype.show = function(obj) {
      addChild(obj)
    };
    Scratch.prototype.isShowing = function(obj) {
      return obj.parent != null
    };
    Scratch.prototype.onResize = function(e) {
      if (!this.ignoreResize) this.fixLayout();
    };
    Scratch.prototype.fixLayout = function() {
      var w = stage.stageWidth;
      var h = stage.stageHeight - 1; // fix to show bottom border...

      w = Math.ceil(w / scaleX);
      h = Math.ceil(h / scaleY);

      this.updateLayout(w, h);
    };
    Scratch.prototype.updateRecordingTools = function(t) {
      this.stagePart.updateRecordingTools(t);
    };
    Scratch.prototype.removeRecordingTools = function() {
      this.stagePart.removeRecordingTools();
    };
    Scratch.prototype.refreshStagePart = function() {
      this.stagePart.refresh();
    };
    Scratch.prototype.updateLayout = function(w, h) {
      this.topBarPart.x = 0;
      this.topBarPart.y = 0;
      this.topBarPart.setWidthHeight(w, 28);

      var extraW = 2;
      var extraH = this.stagePart.computeTopBarHeight() + 1;
      if (this.editMode) {
        // adjust for global scale (from browser zoom)

        if (this.stageIsContracted) {
          this.stagePart.setWidthHeight(240 + extraW, 180 + extraH, 0.5);
        } else {
          this.stagePart.setWidthHeight(480 + extraW, 360 + extraH, 1);
        }
        this.stagePart.x = 5;
        this.stagePart.y = this.isMicroworld ? 5 : this.topBarPart.bottom() + 5;
        this.fixLoadProgressLayout();
      } else {
        this.drawBG();
        var pad = (w > 550) ? 16 : 0; // add padding for full-screen mode
        var scale = Math.min((w - extraW - pad) / 480, (h - extraH - pad) / 360);
        scale = Math.max(0.01, scale);
        var scaledW = Math.floor((scale * 480) / 4) * 4; // round down to a multiple of 4
        scale = scaledW / 480;
        this.presentationScale = scale;
        var playerW = (scale * 480) + extraW;
        var playerH = (scale * 360) + extraH;
        this.stagePart.setWidthHeight(playerW, playerH, scale);
        this.stagePart.x = int((w - playerW) / 2);
        this.stagePart.y = int((h - playerH) / 2);
        this.fixLoadProgressLayout();
        return;
      }
      this.libraryPart.x = this.stagePart.x;
      this.libraryPart.y = this.stagePart.bottom() + 18;
      this.libraryPart.setWidthHeight(this.stagePart.w, h - this.libraryPart.y);

      this.tabsPart.x = this.stagePart.right() + 5;
      if (!this.isMicroworld) {
        this.tabsPart.y = this.topBarPart.bottom() + 5;
        this.tabsPart.fixLayout();
      } else
        this.tabsPart.visible = false;

      // the content area shows the part associated with the currently selected tab:
      var contentY = this.tabsPart.y + 27;
      if (!this.isMicroworld)
        w -= this.tipsWidth();
      this.updateContentArea(this.tabsPart.x, contentY, w - this.tabsPart.x - 6, h - contentY - 5, h);
    };
    Scratch.prototype.updateContentArea = function(contentX, contentY, contentW, contentH, fullH) {
      this.imagesPart.x = this.soundsPart.x = this.scriptsPart.x = contentX;
      this.imagesPart.y = this.soundsPart.y = this.scriptsPart.y = contentY;
      this.imagesPart.setWidthHeight(contentW, contentH);
      this.soundsPart.setWidthHeight(contentW, contentH);
      this.scriptsPart.setWidthHeight(contentW, contentH);

      if (this.mediaLibrary) this.mediaLibrary.setWidthHeight(this.topBarPart.w, fullH);

      SCRATCH::allow3d {
        if (this.isIn3D) this.render3D.onStageResize();
      }
    };
    Scratch.prototype.drawBG = function() {
      var g = this.playerBG.graphics;
      g.clear();
      g.beginFill(0);
      g.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
    };
    Scratch.prototype.modalOverlay = null;
    Scratch.prototype.setModalOverlay = function(enableOverlay) {
      var currentlyEnabled = !!this.modalOverlay;
      if (enableOverlay != currentlyEnabled) {
        if (enableOverlay) {
          function eatEvent(event) {
            event.stopImmediatePropagation();
            event.stopPropagation();
          }

          this.modalOverlay = new Sprite();
          this.modalOverlay.graphics.beginFill(CSS.backgroundColor_ScratchX, 0.8);
          this.modalOverlay.graphics.drawRect(0, 0, stage.width, stage.height);
          this.modalOverlay.addEventListener(MouseEvent.CLICK, eatEvent);
          this.modalOverlay.addEventListener(MouseEvent.MOUSE_DOWN, eatEvent);
          if (SCRATCH::allow3d) { // TODO: use a better flag or rename this one
            // These events are only available in flash 11.2 and above.
            this.modalOverlay.addEventListener(MouseEvent.RIGHT_CLICK, eatEvent);
            this.modalOverlay.addEventListener(MouseEvent.RIGHT_MOUSE_DOWN, eatEvent);
            this.modalOverlay.addEventListener(MouseEvent.MIDDLE_CLICK, eatEvent);
            this.modalOverlay.addEventListener(MouseEvent.MIDDLE_MOUSE_DOWN, eatEvent);
          }
          stage.addChild(this.modalOverlay);
        } else {
          stage.removeChild(this.modalOverlay);
          this.modalOverlay = null;
        }
      }
    };
    Scratch.prototype.logoButtonPressed = function(b) {
      if (this.isExtensionDevMode) {
        this.externalCall('showPage', null, 'home');
      }
    };
    Scratch.prototype.translationChanged = function() {
      // The translation has changed. Fix scripts and update the UI.
      // directionChanged is true if the writing direction (e.g. left-to-right) has changed.
      for each(var o in this.stagePane.allObjects()) {
        o.updateScriptsAfterTranslation();
      }
      var uiLayer = Scratch.app.stagePane.getUILayer();
      for (var i = 0; i < uiLayer.numChildren; ++i) {
        var lw = uiLayer.getChildAt(i) as ListWatcher;
        if (lw) lw.updateTranslation();
      }
      this.topBarPart.updateTranslation();
      this.stagePart.updateTranslation();
      this.libraryPart.updateTranslation();
      this.tabsPart.updateTranslation();
      this.updatePalette(false);
      this.imagesPart.updateTranslation();
      this.soundsPart.updateTranslation();
    };
    Scratch.prototype.showFileMenu = function(b) {
      var m = new Menu(null, 'File', CSS.topBarColor(), 28);
      m.addItem('New', this.createNewProject);
      m.addLine();

      // Derived class will handle this
      this.addFileMenuItems(b, m);

      m.showOnStage(stage, b.x, this.topBarPart.bottom() - 1);
    };
    Scratch.prototype.stopVideo = function(b) {
      this.runtime.stopVideo();
    };
    Scratch.prototype.addFileMenuItems = function(b, m) {
      m.addItem('Load Project', this.runtime.selectProjectFile);
      m.addItem('Save Project', this.exportProjectToFile);
      if (this.runtime.recording || this.runtime.ready == ReadyLabel.COUNTDOWN || this.runtime.ready == ReadyLabel.READY) {
        m.addItem('Stop Video', this.runtime.stopVideo);
      } else {
        m.addItem('Record Project Video', this.runtime.exportToVideo);
      }
      if (this.canUndoRevert()) {
        m.addLine();
        m.addItem('Undo Revert', this.undoRevert);
      } else if (this.canRevert()) {
        m.addLine();
        m.addItem('Revert', this.revertToOriginalProject);
      }

      if (b.lastEvent.shiftKey) {
        m.addLine();
        m.addItem('Save Project Summary', this.saveSummary);
        m.addItem('Show version details', this.showVersionDetails);
      }
      if (b.lastEvent.shiftKey && this.jsEnabled) {
        m.addLine();
        m.addItem('Import experimental extension', function() {
          function loadJSExtension(dialog) {
            var url = dialog.getField('URL').replace(/^\s+|\s+$/g, '');
            if (url.length == 0) return;
            this.externalCall('ScratchExtensions.loadExternalJS', null, url);
          }

          var d = new DialogBox(loadJSExtension);
          d.addTitle('Load Javascript Scratch Extension');
          d.addField('URL', 120);
          d.addAcceptCancelButtons('Load');
          d.showOnStage(Scratch.app.stage);
        });
      }
    };
    Scratch.prototype.showEditMenu = function(b) {
      var m = new Menu(null, 'More', CSS.topBarColor(), 28);
      m.addItem('Undelete', this.runtime.undelete, this.runtime.canUndelete());
      m.addLine();
      m.addItem('Small stage layout', this.toggleSmallStage, true, this.stageIsContracted);
      m.addItem('Turbo mode', this.toggleTurboMode, true, this.interp.turboMode);
      this.addEditMenuItems(b, m);
      var p = b.localToGlobal(new Point(0, 0));
      m.showOnStage(stage, b.x, this.topBarPart.bottom() - 1);
    };
    Scratch.prototype.addEditMenuItems = function(b, m) {
      m.addLine();
      m.addItem('Edit block colors', this.editBlockColors);
    };
    Scratch.prototype.editBlockColors = function() {
      var d = new DialogBox();
      d.addTitle('Edit Block Colors');
      d.addWidget(new BlockColorEditor());
      d.addButton('Close', d.cancel);
      d.showOnStage(stage, true);
    };
    Scratch.prototype.canExportInternals = function() {
      return false;
    };
    Scratch.prototype.showAboutDialog = function() {
      DialogBox.notify(
        'Scratch 2.0 ' + Scratch.versionString,
        '\n\nCopyright © 2012 MIT Media Laboratory' +
        '\nAll rights reserved.' +
        '\n\nPlease do not distribute!', stage);
    };
    Scratch.prototype.onNewProject = function() {};
    Scratch.prototype.createNewProjectAndThen = function(callback) {
      callback = AS3JS.Utils.getDefaultValue(callback, null);

      function clearProject() {
        this.startNewProject('', '');
        this.setProjectName('Untitled');
        this.onNewProject();
        this.topBarPart.refresh();
        this.stagePart.refresh();
        if (callback != null) callback();
      }
      this.saveProjectAndThen(clearProject);
    };
    Scratch.prototype.createNewProject = function(ignore) {
      ignore = AS3JS.Utils.getDefaultValue(ignore, null);
      this.createNewProjectAndThen();
    };
    Scratch.prototype.createNewProjectScratchX = function(jsCallback) {
      this.createNewProjectAndThen(function() {
        this.externalCallArray(jsCallback);
      });
    };
    Scratch.prototype.saveProjectAndThen = function(postSaveAction) {
      postSaveAction = AS3JS.Utils.getDefaultValue(postSaveAction, null);
      // Give the user a chance to save their project, if needed, then call postSaveAction.
      function doNothing() {}

      function cancel() {
        d.cancel();
      }

      function proceedWithoutSaving() {
        d.cancel();
        postSaveAction()
      }

      function save() {
        d.cancel();
        this.exportProjectToFile(false, postSaveAction);
      }

      if (postSaveAction == null) postSaveAction = doNothing;
      if (!this.saveNeeded) {
        postSaveAction();
        return;
      }
      var d = new DialogBox();
      d.addTitle('Save project?');
      d.addButton('Save', save);
      d.addButton('Don\'t save', proceedWithoutSaving);
      d.addButton('Cancel', cancel);
      d.showOnStage(stage);
    };
    Scratch.prototype.exportProjectToFile = function(fromJS, saveCallback) {
      fromJS = AS3JS.Utils.getDefaultValue(fromJS, false);
      saveCallback = AS3JS.Utils.getDefaultValue(saveCallback, null);

      function squeakSoundsConverted() {
        this.scriptsPane.saveScripts(false);
        var projectType = this.extensionManager.hasExperimentalExtensions() ? '.sbx' : '.sb2';
        var defaultName = StringUtil.trim(this.projectName());
        defaultName = ((defaultName.length > 0) ? defaultName : 'project') + projectType;
        var zipData = projIO.encodeProjectAsZipFile(this.stagePane);
        var file = new FileReference();
        file.addEventListener(Event.COMPLETE, fileSaved);
        file.save(zipData, Scratch.fixFileName(defaultName));
      }

      function fileSaved(e) {
        if (!fromJS) this.setProjectName(e.target.name);
        if (this.isExtensionDevMode) {
          // Some versions of the editor think of this as an "export" and some think of it as a "save"
          this.saveNeeded = false;
        }
        if (saveCallback != null) saveCallback();
      }

      if (this.loadInProgress) return;
      var projIO = new ProjectIO(this);
      projIO.convertSqueakSounds(this.stagePane, squeakSoundsConverted);
    };
    Scratch.prototype.saveSummary = function() {
      var name = (this.projectName() || "project") + ".txt";
      var file = new FileReference();
      file.save(this.stagePane.getSummary(), Scratch.fixFileName(name));
    };
    Scratch.prototype.toggleSmallStage = function() {
      this.setSmallStageMode(!this.stageIsContracted);
    };
    Scratch.prototype.toggleTurboMode = function() {
      this.interp.turboMode = !this.interp.turboMode;
      this.stagePart.refresh();
    };
    Scratch.prototype.handleTool = function(tool, evt) {};
    Scratch.prototype.showBubble = function(text, x, y, width) {
      x = AS3JS.Utils.getDefaultValue(x, null);
      y = AS3JS.Utils.getDefaultValue(y, null);
      width = AS3JS.Utils.getDefaultValue(width, 0);
      if (x == null) x = stage.mouseX;
      if (y == null) y = stage.mouseY;
      this.gh.showBubble(text, Number(x), Number(y), width);
    };
    Scratch.prototype.kGitHashFieldWidth = 7 * 41;
    Scratch.prototype.makeVersionDetailsDialog = function() {
      var d = new DialogBox();
      d.addTitle('Version Details');
      d.addField('GPU enabled', this.kGitHashFieldWidth, SCRATCH::allow3d);
      d.addField('scratch-flash', this.kGitHashFieldWidth, SCRATCH::revision);
      return d;
    };
    Scratch.prototype.showVersionDetails = function() {
      var versionDetailsBox = this.makeVersionDetailsDialog();
      versionDetailsBox.addButton('OK', versionDetailsBox.accept);
      versionDetailsBox.showOnStage(stage);
    };
    Scratch.prototype.setLanguagePressed = function(b) {
      function setLanguage(lang) {
        Translator.setLanguage(lang);
        this.languageChanged = true;
      }

      if (Translator.languages.length == 0) return; // empty language list
      var m = new Menu(setLanguage, 'Language', CSS.topBarColor(), 28);
      if (b.lastEvent.shiftKey) {
        m.addItem('import translation file');
        m.addItem('set font size');
        m.addLine();
      }
      for each(var entry in Translator.languages) {
        m.addItem(entry[1], entry[0]);
      }
      var p = b.localToGlobal(new Point(0, 0));
      m.showOnStage(stage, b.x, this.topBarPart.bottom() - 1);
    };
    Scratch.prototype.startNewProject = function(newOwner, newID) {
      this.runtime.installNewProject();
      this.projectOwner = newOwner;
      this.projectID = newID;
      this.projectIsPrivate = true;
    };
    Scratch.prototype.saveNeeded = false;
    Scratch.prototype.setSaveNeeded = function(saveNow) {
      saveNow = AS3JS.Utils.getDefaultValue(saveNow, false);
      saveNow = false;
      // Set saveNeeded flag and update the status string.
      this.saveNeeded = true;
      if (!this.wasEdited) saveNow = true; // force a save on first change
      this.clearRevertUndo();
    };
    Scratch.prototype.clearSaveNeeded = function() {
      // Clear saveNeeded flag and update the status string.
      function twoDigits(n) {
        return ((n < 10) ? '0' : '') + n
      }

      this.saveNeeded = false;
      this.wasEdited = true;
    };
    Scratch.prototype.originalProj = null;
    Scratch.prototype.revertUndo = null;
    Scratch.prototype.saveForRevert = function(projData, isNew, onServer) {
      onServer = AS3JS.Utils.getDefaultValue(onServer, false);
      this.originalProj = projData;
      this.revertUndo = null;
    };
    Scratch.prototype.doRevert = function() {
      this.runtime.installProjectFromData(this.originalProj, false);
    };
    Scratch.prototype.revertToOriginalProject = function() {
      function preDoRevert() {
        this.revertUndo = new ProjectIO(Scratch.app).encodeProjectAsZipFile(this.stagePane);
        this.doRevert();
      }

      if (!this.originalProj) return;
      DialogBox.confirm('Throw away all changes since opening this project?', stage, preDoRevert);
    };
    Scratch.prototype.undoRevert = function() {
      if (!this.revertUndo) return;
      this.runtime.installProjectFromData(this.revertUndo, false);
      this.revertUndo = null;
    };
    Scratch.prototype.canRevert = function() {
      return this.originalProj != null
    };
    Scratch.prototype.canUndoRevert = function() {
      return this.revertUndo != null
    };
    Scratch.prototype.clearRevertUndo = function() {
      this.revertUndo = null
    };
    Scratch.prototype.addNewSprite = function(spr, showImages, atMouse) {
      showImages = AS3JS.Utils.getDefaultValue(showImages, false);
      atMouse = AS3JS.Utils.getDefaultValue(atMouse, false);
      var c, byteCount: int;
      for each(c in spr.costumes) {
        if (!c.baseLayerData) c.prepareToSave()
        byteCount += c.baseLayerData.length;
      }
      if (!this.okayToAdd(byteCount)) return; // not enough room
      spr.objName = this.stagePane.unusedSpriteName(spr.objName);
      spr.indexInLibrary = 1000000; // add at end of library
      spr.setScratchXY(int(200 * Math.random() - 100), int(100 * Math.random() - 50));
      if (atMouse) spr.setScratchXY(this.stagePane.scratchMouseX(), this.stagePane.scratchMouseY());
      this.stagePane.addChild(spr);
      spr.updateCostume();
      this.selectSprite(spr);
      this.setTab(showImages ? 'images' : 'scripts');
      this.setSaveNeeded(true);
      this.libraryPart.refresh();
      for each(c in spr.costumes) {
        if (ScratchCostume.isSVGData(c.baseLayerData)) c.setSVGData(c.baseLayerData, false);
      }
    };
    Scratch.prototype.addSound = function(snd, targetObj) {
      targetObj = AS3JS.Utils.getDefaultValue(targetObj, null);
      if (snd.soundData && !this.okayToAdd(snd.soundData.length)) return; // not enough room
      if (!targetObj) targetObj = this.viewedObj();
      snd.soundName = targetObj.unusedSoundName(snd.soundName);
      targetObj.sounds.push(snd);
      this.setSaveNeeded(true);
      if (targetObj == this.viewedObj()) {
        this.soundsPart.selectSound(snd);
        this.setTab('sounds');
      }
    };
    Scratch.prototype.addCostume = function(c, targetObj) {
      targetObj = AS3JS.Utils.getDefaultValue(targetObj, null);
      if (!c.baseLayerData) c.prepareToSave();
      if (!this.okayToAdd(c.baseLayerData.length)) return; // not enough room
      if (!targetObj) targetObj = this.viewedObj();
      c.costumeName = targetObj.unusedCostumeName(c.costumeName);
      targetObj.costumes.push(c);
      targetObj.showCostumeNamed(c.costumeName);
      this.setSaveNeeded(true);
      if (targetObj == this.viewedObj()) this.setTab('images');
    };
    Scratch.prototype.okayToAdd = function(newAssetBytes) {
      // Return true if there is room to add an asset of the given size.
      // Otherwise, return false and display a warning dialog.
      var assetByteLimit = 50 * 1024 * 1024; // 50 megabytes
      var assetByteCount = newAssetBytes;
      for each(var obj in this.stagePane.allObjects()) {
        for each(var c in obj.costumes) {
          if (!c.baseLayerData) c.prepareToSave();
          assetByteCount += c.baseLayerData.length;
        }
        for each(var snd in obj.sounds) assetByteCount += snd.soundData.length;
      }
      if (assetByteCount > assetByteLimit) {
        var overBy = Math.max(1, (assetByteCount - assetByteLimit) / 1024);
        DialogBox.notify(
          'Sorry!',
          'Adding that media asset would put this project over the size limit by ' + overBy + ' KB\n' +
          'Please remove some costumes, backdrops, or sounds before adding additional media.',
          stage);
        return false;
      }
      return true;
    };
    Scratch.prototype.flashSprite = function(spr) {
      function doFade(alpha) {
        box.alpha = alpha
      }

      function deleteBox() {
        if (box.parent) {
          box.parent.removeChild(box)
        }
      }

      var r = spr.getVisibleBounds(this);
      var box = new Shape();
      box.graphics.lineStyle(3, CSS.overColor, 1, true);
      box.graphics.beginFill(0x808080);
      box.graphics.drawRoundRect(0, 0, r.width, r.height, 12, 12);
      box.x = r.x;
      box.y = r.y;
      addChild(box);
      Transition.cubic(doFade, 1, 0, 0.5, deleteBox);
    };
    Scratch.prototype.addLoadProgressBox = function(title) {
      this.removeLoadProgressBox();
      this.lp = new LoadProgress();
      this.lp.setTitle(title);
      stage.addChild(this.lp);
      this.fixLoadProgressLayout();
    };
    Scratch.prototype.removeLoadProgressBox = function() {
      if (this.lp && this.lp.parent) this.lp.parent.removeChild(this.lp);
      this.lp = null;
    };
    Scratch.prototype.fixLoadProgressLayout = function() {
      if (!this.lp) return;
      var p = this.stagePane.localToGlobal(new Point(0, 0));
      this.lp.scaleX = this.stagePane.scaleX;
      this.lp.scaleY = this.stagePane.scaleY;
      this.lp.x = int(p.x + ((this.stagePane.width - this.lp.width) / 2));
      this.lp.y = int(p.y + ((this.stagePane.height - this.lp.height) / 2));
    };
    Scratch.prototype.openCameraDialog = function(savePhoto) {
      this.closeCameraDialog();
      this.cameraDialog = new CameraDialog(savePhoto);
      this.cameraDialog.fixLayout();
      this.cameraDialog.x = (stage.stageWidth - this.cameraDialog.width) / 2;
      this.cameraDialog.y = (stage.stageHeight - this.cameraDialog.height) / 2;
      addChild(this.cameraDialog);
    };
    Scratch.prototype.closeCameraDialog = function() {
      if (this.cameraDialog) {
        this.cameraDialog.closeDialog();
        this.cameraDialog = null;
      }
    };
    Scratch.prototype.createMediaInfo = function(obj, owningObj) {
      owningObj = AS3JS.Utils.getDefaultValue(owningObj, null);
      return new MediaInfo(obj, owningObj);
    };
    Scratch.prototype.externalInterfaceAvailable = function() {
      return ExternalInterface.available;
    };
    Scratch.prototype.externalCall = function(functionName, returnValueCallback, args) {
      returnValueCallback = AS3JS.Utils.getDefaultValue(returnValueCallback, null);
      args.unshift(functionName);
      var retVal;
      try {
        retVal = ExternalInterface.call.apply(ExternalInterface, args);
      } catch (e: Error) {
        this.logException(e);
        // fall through to below
      }
      if (returnValueCallback != null) {
        returnValueCallback(retVal);
      }
    };
    Scratch.prototype.addExternalCallback = function(functionName, closure) {
      ExternalInterface.addCallback(functionName, closure);
    };
    Scratch.prototype.externalCallArray = function(jsCallbackArray, returnValueCallback) {
      returnValueCallback = AS3JS.Utils.getDefaultValue(returnValueCallback, null);
      var args = jsCallbackArray.concat(); // clone
      args.splice(1, 0, returnValueCallback);
      this.externalCall.apply(this, args);
    }

    module.exports = Scratch;
  };
  if (typeof module !== 'undefined') {
    module.exports = AS3JS.load({
      program: Program,
      entry: "Scratch",
      entryMode: "instance"
    });
  } else if (typeof window !== 'undefined' && typeof AS3JS !== 'undefined') {
    window['Scratch'] = AS3JS.load({
      program: Program,
      entry: "Scratch",
      entryMode: "instance"
    });
  }
})();
