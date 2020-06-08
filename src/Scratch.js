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
package Scratch {
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

default class Scratch extends Sprite {
	// Version
	var app = new Scratch(); // static reference to the app, used for debugging

	// Display modes 
	var hostProtocol = 'http';
	var editMode; // true when project editor showing, false when only the player is showing
	var isOffline; // true when running as an offline (i.e. stand-alone) app
	var isSmallPlayer; // true when displaying as a scaled-down player (e.g. in search results)
	var stageIsContracted; // true when the stage is half size to give more space on small screens
	var isIn3D;
	var render3D = new DisplayObjectContainerIn3D();
	var isArmCPU;
	var jsEnabled = false; // true when the SWF can talk to the webpage
	var ignoreResize = false; // If true, temporarily ignore resize events.
	var isExtensionDevMode = false; // If true, run in extension development mode (as on ScratchX)
	var isMicroworld = false;

	var presentationScale;
	
	// Runtime
	var runtime = new ScratchRuntime();
	var interperpreter;
	var extensionManager = new ExtensionManager();
	var server = new Server();
	var gh = new GestureHandler();
	var projectID = '';
	var projectOwner = '';
	var projectIsPrivate;
	var oldWebsiteURL = '';
	var loadInProgress;
	var debugOps = false;
	var debugOpCmd = '';

	protected var autostart;
	private var viewedObject = new ScratchObj();
	private var lastTab = 'scripts';
	protected var wasEdited; // true if the project was edited and autosaved
	private var _usesUserNameBlock = false;
	protected var languageChanged; // set when language changed

	// UI Elements
	var playerBG = new Shape();
	var palette = new BlockPalette();
	var scriptsPane = new ScriptsPane();
	var stagePane = new ScratchStage();
	var mediaLibrary = new MediaLibrary();
	var lp = new LoadProgress();
	var cameraDialog = new CameraDialog();

	// UI Parts
	var libraryPart = new LibraryPart();
	protected var topBarPart = new TopBarPart();
	protected var stagePart = new StagePart();
	private var tabsPart = new TabsPart();
	protected var scriptsPart = new ScriptsPart();
	var imagesPart = new ImagesPart();
	var soundsPart = new SoundsPart();
	const tipsBarClosedWidth = 17;

	var logger = new Log(16);

	function Scratch() {
		SVGTool.setStage(stage);
		loaderInfo.uncaughtErrorEvents.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, uncaughtErrorHandler);
		app = this;

		// This one must finish before most other queries can start, so do it separately
		determineJSAccess();
	}

	protected function determineJSAccess() {
		if (externalInterfaceAvailable()) {
			try {
				externalCall('function(){return true;}', jsAccessDetermined);
				return; // wait for callback
			}
			catch (e:Error) {
			}
		}
		jsAccessDetermined(false);
	}

	private function jsAccessDetermined(result) {
		jsEnabled = result;
		initialize();
	}

	protected function initialize() {
		isOffline = !URLUtil.isHttpURL(loaderInfo.url);
		hostProtocol = URLUtil.getProtocol(loaderInfo.url);

		isExtensionDevMode = (loaderInfo.parameters['extensionDevMode'] == 'true');
		isMicroworld = (loaderInfo.parameters['microworldMode'] == 'true');

		initServer();

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
		app = this;

		stagePane = getScratchStage();
		gh = new GestureHandler(this, (loaderInfo.parameters['inIE'] == 'true'));
		initInterpreter();
		initRuntime();
		initExtensionManager();
		Translator.initializeLanguageList();

		playerBG = new Shape(); // create, but don't add
		addParts();

		server.getSelectedLang(Translator.setLanguageValue);


		stage.addEventListener(MouseEvent.MOUSE_DOWN, gh.mouseDown);
		stage.addEventListener(MouseEvent.MOUSE_MOVE, gh.mouseMove);
		stage.addEventListener(MouseEvent.MOUSE_UP, gh.mouseUp);
		stage.addEventListener(MouseEvent.MOUSE_WHEEL, gh.mouseWheel);
		stage.addEventListener('rightClick', gh.rightMouseClick);

		stage.addEventListener(KeyboardEvent.KEY_UP, runtime.keyUp);
		stage.addEventListener(KeyboardEvent.KEY_DOWN, keyDown); // to handle escape key
		stage.addEventListener(Event.ENTER_FRAME, step);
		stage.addEventListener(Event.RESIZE, onResize);

		setEditMode(startInEditMode());

		// install project before calling fixLayout()
		if (editMode) runtime.installNewProject();
		else runtime.installEmptyProject();

		fixLayout();
		//Analyze.collectAssets(0, 119110);
		//Analyze.checkProjects(56086, 64220);
		//Analyze.countMissingAssets();

		handleStartupParameters();
	}

	protected function handleStartupParameters() {
		setupExternalInterface(false);
		jsEditorReady();
	}

	protected function setupExternalInterface(oldWebsitePlayer) {
		if (!jsEnabled) return;

		addExternalCallback('ASloadExtension', extensionManager.loadRawExtension);
		addExternalCallback('ASextensionCallDone', extensionManager.callCompleted);
		addExternalCallback('ASextensionReporterDone', extensionManager.reporterCompleted);
		addExternalCallback('AScreateNewProject', createNewProjectScratchX);

		if (isExtensionDevMode) {
			addExternalCallback('ASloadGithubURL', loadGithubURL);
			addExternalCallback('ASloadBase64SBX', loadBase64SBX);
			addExternalCallback('ASsetModalOverlay', setModalOverlay);
		}
	}

	protected function jsEditorReady() {
		if (jsEnabled) {
			externalCall('JSeditorReady', function (success) {
				if (!success) jsThrowError('Calling JSeditorReady() failed.');
			});
		}
	}

	private function loadSingleGithubURL(url) {
		url = StringUtil.trim(unescape(url));

		function handleComplete(e:Event) {
			runtime.installProjectFromData(sbxLoader.data);
			if (StringUtil.trim(projectName()).length == 0) {
				var newProjectName = url;
				var index = newProjectName.indexOf('?');
				if (index > 0) newProjectName = newProjectName.slice(0, index);
				index = newProjectName.lastIndexOf('/');
				if (index > 0) newProjectName = newProjectName.substr(index + 1);
				index = newProjectName.lastIndexOf('.sbx');
				if (index > 0) newProjectName = newProjectName.slice(0, index);
				setProjectName(newProjectName);
			}
		}

		function handleError(e:ErrorEvent) {
			jsThrowError('Failed to load SBX: ' + e.toString());
		}

		var fileExtension = url.substr(url.lastIndexOf('.')).toLowerCase();
		if (fileExtension == '.js') {
			externalCall('ScratchExtensions.loadExternalJS', null, url);
			return;
		}

		// Otherwise assume it's a project (SB2, SBX, etc.)
		loadInProgress = true;
		var request:URLRequest = new URLRequest(url);
		var sbxLoader:URLLoader = new URLLoader(request);
		sbxLoader.dataFormat = URLLoaderDataFormat.BINARY;
		sbxLoader.addEventListener(Event.COMPLETE, handleComplete);
		sbxLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, handleError);
		sbxLoader.addEventListener(IOErrorEvent.IO_ERROR, handleError);
		sbxLoader.load(request);
	}

	private var pendingExtensionURLs:Array;
	private function loadGithubURL(urlOrArray:*) {
		if (!isExtensionDevMode) return;

		var url;
		var urlArray:Array = urlOrArray as Array;
		if (urlArray) {
			var urlCount = urlArray.length;
			var extensionURLs:Array = [];
			var projectURL;
			var index;

			// Filter URLs: allow at most one project file, and wait until it loads before loading extensions.
			for (index = 0; index < urlCount; ++index) {
				url = StringUtil.trim(unescape(urlArray[index]));
				if (StringUtil.endsWith(url.toLowerCase(), '.js')) {
					extensionURLs.push(url);
				}
				else if (url.length > 0) {
					if (projectURL) {
						jsThrowError("Ignoring extra project URL: " + projectURL);
					}
					projectURL = StringUtil.trim(url);
				}
			}
			if (projectURL) {
				pendingExtensionURLs = extensionURLs;
				loadSingleGithubURL(projectURL);
				// warning will be shown later
			}
			else {
				urlCount = extensionURLs.length;
				for (index = 0; index < urlCount; ++index) {
					loadSingleGithubURL(extensionURLs[index]);
				}
				externalCall('JSshowWarning');
			}
		}
		else {
			url = urlOrArray as String;
			loadSingleGithubURL(url);
			externalCall('JSshowWarning');
		}
	}

	private function loadBase64SBX(base64) {
		var sbxData:ByteArray = Base64Encoder.decode(base64);
		app.setProjectName('');
		runtime.installProjectFromData(sbxData);
	}

	protected function initTopBarPart() {
		topBarPart = new TopBarPart(this);
	}

	protected function initScriptsPart() {
		scriptsPart = new ScriptsPart(this);
	}

	protected function initImagesPart() {
		imagesPart = new ImagesPart(this);
	}

	protected function initInterpreter() {
		interp = new Interpreter(this);
	}

	protected function initRuntime() {
		runtime = new ScratchRuntime(this, interp);
	}

	protected function initExtensionManager() {
		if (isExtensionDevMode) {
			extensionManager = new ExtensionDevManager(this);
		}
		else {
			extensionManager = new ExtensionManager(this);
		}
	}

	protected function initServer() {
		server = new Server();
	}

	function showTip(tipName) {
	}

	function closeTips() {
	}

	function reopenTips() {
	}

	function tipsWidth() {
		return 0;
	}

	protected function startInEditMode() {
		return isOffline || isExtensionDevMode;
	}

	function getMediaLibrary(type, whenDone:Function):MediaLibrary {
		return new MediaLibrary(this, type, whenDone);
	}

	function getMediaPane(app:Scratch, type):MediaPane {
		return new MediaPane(app, type);
	}

	function getScratchStage():ScratchStage {
		return new ScratchStage();
	}

	function getPaletteBuilder():PaletteBuilder {
		return new PaletteBuilder(this);
	}

	private function uncaughtErrorHandler(event:UncaughtErrorEvent) {
		if (event.error is Error) {
			var error:Error = event.error as Error;
			logException(error);
		}
		else if (event.error is ErrorEvent) {
			var errorEvent:ErrorEvent = event.error as ErrorEvent;
			log(LogLevel.ERROR, errorEvent.toString());
		}
	}

	// All other log...() methods funnel to this one
	function log(severity, messageKey, extraData:Object = null):LogEntry {
		return logger.log(severity, messageKey, extraData);
	}

	// Log an Error object generated by an exception
	function logException(e:Error) {
		log(LogLevel.ERROR, e.toString());
	}

	// Shorthand for log(LogLevel.ERROR, ...)
	function logMessage(msg, extra_data:Object = null) {
		log(LogLevel.ERROR, msg, extra_data);
	}

	function loadProjectFailed() {
		loadInProgress = false;
	}

	function jsThrowError(s) {
		// Throw the given string as an error in the browser. Errors on the production site are logged.
		var errorString = 'SWF Error: ' + s;
		log(LogLevel.WARNING, errorString);
		if (jsEnabled) {
			externalCall('JSthrowError', null, errorString);
		}
	}


	SCRATCH::allow3d
	protected function handleRenderCallback(enabled) {
		if (!enabled) {
			go2D();
			render3D = null;
		}
		else {
			for (var i = 0; i < stagePane.numChildren; ++i) {
				var spr:ScratchSprite = (stagePane.getChildAt(i) as ScratchSprite);
				if (spr) {
					spr.clearCachedBitmap();
					spr.updateCostume();
					spr.applyFilters();
				}
			}
			stagePane.clearCachedBitmap();
			stagePane.updateCostume();
			stagePane.applyFilters();
		}
	}

	function clearCachedBitmaps() {
		for (var i = 0; i < stagePane.numChildren; ++i) {
			var spr:ScratchSprite = (stagePane.getChildAt(i) as ScratchSprite);
			if (spr) spr.clearCachedBitmap();
		}
		stagePane.clearCachedBitmap();

		// unsupported technique that seems to force garbage collection
		try {
			new LocalConnection().connect('foo');
			new LocalConnection().connect('foo');
		} catch (e:Error) {
		}
	}

	SCRATCH::allow3d
	function go3D() {
		if (!render3D || isIn3D) return;

		var i = stagePart.getChildIndex(stagePane);
		stagePart.removeChild(stagePane);
		render3D.setStage(stagePane, stagePane.penLayer);
		stagePart.addChildAt(stagePane, i);
		isIn3D = true;
	}

	SCRATCH::allow3d
	function go2D() {
		if (!render3D || !isIn3D) return;

		var i = stagePart.getChildIndex(stagePane);
		stagePart.removeChild(stagePane);
		render3D.setStage(null, null);
		stagePart.addChildAt(stagePane, i);
		isIn3D = false;
		for (i = 0; i < stagePane.numChildren; ++i) {
			var spr:ScratchSprite = (stagePane.getChildAt(i) as ScratchSprite);
			if (spr) {
				spr.clearCachedBitmap();
				spr.updateCostume();
				spr.applyFilters();
			}
		}
		stagePane.clearCachedBitmap();
		stagePane.updateCostume();
		stagePane.applyFilters();
	}

	private var debugRect:Shape;

	function showDebugRect(r:Rectangle) {
		// Used during debugging...
		var p:Point = stagePane.localToGlobal(new Point(0, 0));
		if (!debugRect) debugRect = new Shape();
		var g:Graphics = debugRect.graphics;
		g.clear();
		if (r) {
			g.lineStyle(2, 0xFFFF00);
			g.drawRect(p.x + r.x, p.y + r.y, r.width, r.height);
			addChild(debugRect);
		}
	}

	function strings():Array {
		return [
			'a copy of the project file on your computer.',
			'Project not saved!', 'Save now', 'Not saved; project did not load.',
			'Save project?', 'Don\'t save',
			'Save now', 'Saved',
			'Revert', 'Undo Revert', 'Reverting...',
			'Throw away all changes since opening this project?',
		];
	}

	function viewedObj():ScratchObj {
		return viewedObject;
	}

	function stageObj():ScratchStage {
		return stagePane;
	}

	function projectName() {
		return stagePart.projectName();
	}

	function highlightSprites(sprites:Array) {
		libraryPart.highlight(sprites);
	}

	function refreshImageTab(fromEditor) {
		imagesPart.refresh(fromEditor);
	}

	function refreshSoundTab() {
		soundsPart.refresh();
	}

	function selectCostume() {
		imagesPart.selectCostume();
	}

	function selectSound(snd:ScratchSound) {
		soundsPart.selectSound(snd);
	}

	function clearTool() {
		CursorTool.setTool(null);
		topBarPart.clearToolButtons();
	}

	function tabsRight() {
		return tabsPart.x + tabsPart.w;
	}

	function enableEditorTools(flag) {
		imagesPart.editor.enableTools(flag);
	}

	function get usesUserNameBlock() {
		return _usesUserNameBlock;
	}

	function set usesUserNameBlock(value) {
		_usesUserNameBlock = value;
		stagePart.refresh();
	}

	function updatePalette(clearCaches = true) {
		// Note: updatePalette() is called after changing variable, list, or procedure
		// definitions, so this is a convenient place to clear the interpreter's caches.
		if (isShowing(scriptsPart)) scriptsPart.updatePalette();
		if (clearCaches) runtime.clearAllCaches();
	}

	function setProjectName(s) {
		for (;;) {
			if (StringUtil.endsWith(s, '.sb')) s = s.slice(0, -3);
			else if (StringUtil.endsWith(s, '.sb2')) s = s.slice(0, -4);
			else if (StringUtil.endsWith(s, '.sbx')) s = s.slice(0, -4);
			else break;
		}
		stagePart.setProjectName(s);
	}

	protected var wasEditing;

	function setPresentationMode(enterPresentation) {
		if (stagePart.isInPresentationMode() != enterPresentation) {
			presentationModeWasChanged(enterPresentation);
		}
	}

	function presentationModeWasChanged(enterPresentation) {
		if (enterPresentation) {
			wasEditing = editMode;
			if (wasEditing) {
				setEditMode(false);
				if (jsEnabled) externalCall('tip_bar_api.hide');
			}
		} else {
			if (wasEditing) {
				setEditMode(true);
				if (jsEnabled) externalCall('tip_bar_api.show');
			}
		}
		if (isOffline) {
			stage.displayState = enterPresentation ? StageDisplayState.FULL_SCREEN_INTERACTIVE : StageDisplayState.NORMAL;
		}
		for each (var o:ScratchObj in stagePane.allObjects()) o.applyFilters();

		if (lp) fixLoadProgressLayout();
		stagePart.presentationModeWasChanged(enterPresentation);
		stagePane.updateCostume();
		SCRATCH::allow3d {
			if (isIn3D) render3D.onStageResize();
		}
	}

	private function keyDown(evt:KeyboardEvent) {
		// Escape stops drag operations
		if (!evt.shiftKey && evt.charCode == 27) {
			gh.escKeyDown();
		}
		// Escape exists presentation mode.
		else if ((evt.charCode == 27) && stagePart.isInPresentationMode()) {
			setPresentationMode(false);
		}
		// Handle enter key
//		else if(evt.keyCode == 13 && !stage.focus) {
//			stagePart.playButtonPressed(null);
//			evt.preventDefault();
//			evt.stopImmediatePropagation();
//		}
		// Handle ctrl-m and toggle 2d/3d mode
		else if (evt.ctrlKey && evt.charCode == 109) {
			SCRATCH::allow3d {
				isIn3D ? go2D() : go3D();
			}
			evt.preventDefault();
			evt.stopImmediatePropagation();
		}
		else {
			runtime.keyDown(evt);
		}
	}

	private function setSmallStageMode(flag) {
		stageIsContracted = flag;
		stagePart.updateRecordingTools();
		fixLayout();
		libraryPart.refresh();
		tabsPart.refresh();
		stagePane.applyFilters();
		stagePane.updateCostume();
	}

	function projectLoaded() {
		removeLoadProgressBox();
		System.gc();
		if (autostart) runtime.startGreenFlags(true);
		loadInProgress = false;
		saveNeeded = false;

		// translate the blocks of the newly loaded project
		for each (var o:ScratchObj in stagePane.allObjects()) {
			o.updateScriptsAfterTranslation();
		}

		if (jsEnabled && isExtensionDevMode) {
			if (pendingExtensionURLs) {
				loadGithubURL(pendingExtensionURLs);
				pendingExtensionURLs = null;
			}
			externalCall('JSprojectLoaded');
		}
	}

	function resetPlugin(whenDone:Function) {
		if (jsEnabled) {
			externalCall('ScratchExtensions.resetPlugin');
		}
		if (whenDone != null) {
			whenDone();
		}
	}

	protected function step(e:Event) {
		// Step the runtime system and all UI components.
		CachedTimer.clearCachedTimer();
		gh.step();
		runtime.stepRuntime();
		Transition.step(null);
		stagePart.step();
		libraryPart.step();
		scriptsPart.step();
		imagesPart.step();
	}

	function updateSpriteLibrary(sortByIndex = false) {
		libraryPart.refresh()
	}

	function updateTopBar() {
		topBarPart.refresh();
	}

	function threadStarted() {
		stagePart.threadStarted()
	}

	function selectSprite(obj:ScratchObj) {
		if (isShowing(imagesPart)) imagesPart.editor.shutdown();
		if (isShowing(soundsPart)) soundsPart.editor.shutdown();
		viewedObject = obj;
		libraryPart.refresh();
		tabsPart.refresh();
		if (isShowing(imagesPart)) {
			imagesPart.refresh();
		}
		if (isShowing(soundsPart)) {
			soundsPart.currentIndex = 0;
			soundsPart.refresh();
		}
		if (isShowing(scriptsPart)) {
			scriptsPart.updatePalette();
			scriptsPane.viewScriptsFor(obj);
			scriptsPart.updateSpriteWatermark();
		}
	}

	function setTab(tabName) {
		if (isShowing(imagesPart)) imagesPart.editor.shutdown();
		if (isShowing(soundsPart)) soundsPart.editor.shutdown();
		hide(scriptsPart);
		hide(imagesPart);
		hide(soundsPart);
		if (!editMode) return;
		if (tabName == 'images') {
			show(imagesPart);
			imagesPart.refresh();
		} else if (tabName == 'sounds') {
			soundsPart.refresh();
			show(soundsPart);
		} else if (tabName && (tabName.length > 0)) {
			tabName = 'scripts';
			scriptsPart.updatePalette();
			scriptsPane.viewScriptsFor(viewedObject);
			scriptsPart.updateSpriteWatermark();
			show(scriptsPart);
		}
		show(tabsPart);
		show(stagePart); // put stage in front
		tabsPart.selectTab(tabName);
		lastTab = tabName;
		if (saveNeeded) setSaveNeeded(true); // save project when switching tabs, if needed (but NOT while loading!)
	}

	function installStage(newStage:ScratchStage) {
		var showGreenflagOverlay = shouldShowGreenFlag();
		stagePart.installStage(newStage, showGreenflagOverlay);
		selectSprite(newStage);
		libraryPart.refresh();
		setTab('scripts');
		scriptsPart.resetCategory();
		wasEdited = false;
	}

	protected function shouldShowGreenFlag() {
		return !(autostart || editMode);
	}

	protected function addParts() {
		initTopBarPart();
		stagePart = getStagePart();
		libraryPart = getLibraryPart();
		tabsPart = new TabsPart(this);
		initScriptsPart();
		initImagesPart();
		soundsPart = new SoundsPart(this);
		addChild(topBarPart);
		addChild(stagePart);
		addChild(libraryPart);
		addChild(tabsPart);
	}

	protected function getStagePart():StagePart {
		return new StagePart(this);
	}

	protected function getLibraryPart():LibraryPart {
		return new LibraryPart(this);
	}

	function fixExtensionURL(javascriptURL) {
		return javascriptURL;
	}

	// -----------------------------
	// UI Modes and Resizing
	//------------------------------

	function setEditMode(newMode) {
		Menu.removeMenusFrom(stage);
		editMode = newMode;
		if (editMode) {
			interp.showAllRunFeedback();
			hide(playerBG);
			show(topBarPart);
			show(libraryPart);
			show(tabsPart);
			setTab(lastTab);
			stagePart.hidePlayButton();
			runtime.edgeTriggersEnabled = true;
		} else {
			addChildAt(playerBG, 0); // behind everything
			playerBG.visible = false;
			hide(topBarPart);
			hide(libraryPart);
			hide(tabsPart);
			setTab(null); // hides scripts, images, and sounds
		}
		stagePane.updateListWatchers();
		show(stagePart); // put stage in front
		fixLayout();
		stagePart.refresh();
	}

	protected function hide(obj:DisplayObject) {
		if (obj.parent) obj.parent.removeChild(obj)
	}

	protected function show(obj:DisplayObject) {
		addChild(obj)
	}

	protected function isShowing(obj:DisplayObject) {
		return obj.parent != null
	}

	function onResize(e:Event) {
		if (!ignoreResize) fixLayout();
	}

	function fixLayout() {
		var w = stage.stageWidth;
		var h = stage.stageHeight - 1; // fix to show bottom border...

		w = Math.ceil(w / scaleX);
		h = Math.ceil(h / scaleY);

		updateLayout(w, h);
	}
	
	function updateRecordingTools(t) {
		stagePart.updateRecordingTools(t);
	}
	
	function removeRecordingTools() {
		stagePart.removeRecordingTools();
	}
	
	function refreshStagePart() {
		stagePart.refresh();
	}

	protected function updateLayout(w, h) {
		topBarPart.x = 0;
		topBarPart.y = 0;
		topBarPart.setWidthHeight(w, 28);

		var extraW = 2;
		var extraH = stagePart.computeTopBarHeight() + 1;
		if (editMode) {
			// adjust for global scale (from browser zoom)

			if (stageIsContracted) {
				stagePart.setWidthHeight(240 + extraW, 180 + extraH, 0.5);
			} else {
				stagePart.setWidthHeight(480 + extraW, 360 + extraH, 1);
			}
			stagePart.x = 5;
			stagePart.y = isMicroworld ? 5 : topBarPart.bottom() + 5;
			fixLoadProgressLayout();
		} else {
			drawBG();
			var pad = (w > 550) ? 16 : 0; // add padding for full-screen mode
			var scale = Math.min((w - extraW - pad) / 480, (h - extraH - pad) / 360);
			scale = Math.max(0.01, scale);
			var scaledW = Math.floor((scale * 480) / 4) * 4; // round down to a multiple of 4
			scale = scaledW / 480;
			presentationScale = scale;
			var playerW = (scale * 480) + extraW;
			var playerH = (scale * 360) + extraH;
			stagePart.setWidthHeight(playerW, playerH, scale);
			stagePart.x = int((w - playerW) / 2);
			stagePart.y = int((h - playerH) / 2);
			fixLoadProgressLayout();
			return;
		}
		libraryPart.x = stagePart.x;
		libraryPart.y = stagePart.bottom() + 18;
		libraryPart.setWidthHeight(stagePart.w, h - libraryPart.y);

		tabsPart.x = stagePart.right() + 5;
		if (!isMicroworld) {
			tabsPart.y = topBarPart.bottom() + 5;
			tabsPart.fixLayout();
		}
		else
			tabsPart.visible = false;

		// the content area shows the part associated with the currently selected tab:
		var contentY = tabsPart.y + 27;
		if (!isMicroworld)
			w -= tipsWidth();
		updateContentArea(tabsPart.x, contentY, w - tabsPart.x - 6, h - contentY - 5, h);
	}

	protected function updateContentArea(contentX, contentY, contentW, contentH, fullH) {
		imagesPart.x = soundsPart.x = scriptsPart.x = contentX;
		imagesPart.y = soundsPart.y = scriptsPart.y = contentY;
		imagesPart.setWidthHeight(contentW, contentH);
		soundsPart.setWidthHeight(contentW, contentH);
		scriptsPart.setWidthHeight(contentW, contentH);

		if (mediaLibrary) mediaLibrary.setWidthHeight(topBarPart.w, fullH);

		SCRATCH::allow3d {
			if (isIn3D) render3D.onStageResize();
		}
	}

	private function drawBG() {
		var g:Graphics = playerBG.graphics;
		g.clear();
		g.beginFill(0);
		g.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
	}

	private var modalOverlay:Sprite;

	function setModalOverlay(enableOverlay) {
		var currentlyEnabled = !!modalOverlay;
		if (enableOverlay != currentlyEnabled) {
			if (enableOverlay) {
				function eatEvent(event:MouseEvent) {
					event.stopImmediatePropagation();
					event.stopPropagation();
				}

				modalOverlay = new Sprite();
				modalOverlay.graphics.beginFill(CSS.backgroundColor_ScratchX, 0.8);
				modalOverlay.graphics.drawRect(0, 0, stage.width, stage.height);
				modalOverlay.addEventListener(MouseEvent.CLICK, eatEvent);
				modalOverlay.addEventListener(MouseEvent.MOUSE_DOWN, eatEvent);
				if (SCRATCH::allow3d) { // TODO: use a better flag or rename this one
					// These events are only available in flash 11.2 and above.
					modalOverlay.addEventListener(MouseEvent.RIGHT_CLICK, eatEvent);
					modalOverlay.addEventListener(MouseEvent.RIGHT_MOUSE_DOWN, eatEvent);
					modalOverlay.addEventListener(MouseEvent.MIDDLE_CLICK, eatEvent);
					modalOverlay.addEventListener(MouseEvent.MIDDLE_MOUSE_DOWN, eatEvent);
				}
				stage.addChild(modalOverlay);
			}
			else {
				stage.removeChild(modalOverlay);
				modalOverlay = null;
			}
		}
	}

	function logoButtonPressed(b:IconButton) {
		if (isExtensionDevMode) {
			externalCall('showPage', null, 'home');
		}
	}

	// -----------------------------
	// Translations utilities
	//------------------------------

	function translationChanged() {
		// The translation has changed. Fix scripts and update the UI.
		// directionChanged is true if the writing direction (e.g. left-to-right) has changed.
		for each (var o:ScratchObj in stagePane.allObjects()) {
			o.updateScriptsAfterTranslation();
		}
		var uiLayer:Sprite = app.stagePane.getUILayer();
		for (var i = 0; i < uiLayer.numChildren; ++i) {
			var lw:ListWatcher = uiLayer.getChildAt(i) as ListWatcher;
			if (lw) lw.updateTranslation();
		}
		topBarPart.updateTranslation();
		stagePart.updateTranslation();
		libraryPart.updateTranslation();
		tabsPart.updateTranslation();
		updatePalette(false);
		imagesPart.updateTranslation();
		soundsPart.updateTranslation();
	}

	// -----------------------------
	// Menus
	//------------------------------
	function showFileMenu(b:*) {
		var m:Menu = new Menu(null, 'File', CSS.topBarColor(), 28);
		m.addItem('New', createNewProject);
		m.addLine();

		// Derived class will handle this
		addFileMenuItems(b, m);

		m.showOnStage(stage, b.x, topBarPart.bottom() - 1);
	}
	
	function stopVideo(b:*) {
		runtime.stopVideo();
	}

	protected function addFileMenuItems(b:*, m:Menu) {
		m.addItem('Load Project', runtime.selectProjectFile);
		m.addItem('Save Project', exportProjectToFile);
		if (runtime.recording || runtime.ready==ReadyLabel.COUNTDOWN || runtime.ready==ReadyLabel.READY) {
			m.addItem('Stop Video', runtime.stopVideo);
		} else {
			m.addItem('Record Project Video', runtime.exportToVideo);
		}
		if (canUndoRevert()) {
			m.addLine();
			m.addItem('Undo Revert', undoRevert);
		} else if (canRevert()) {
			m.addLine();
			m.addItem('Revert', revertToOriginalProject);
		}

		if (b.lastEvent.shiftKey) {
			m.addLine();
			m.addItem('Save Project Summary', saveSummary);
			m.addItem('Show version details', showVersionDetails);
		}
		if (b.lastEvent.shiftKey && jsEnabled) {
			m.addLine();
			m.addItem('Import experimental extension', function () {
				function loadJSExtension(dialog:DialogBox) {
					var url = dialog.getField('URL').replace(/^\s+|\s+$/g, '');
					if (url.length == 0) return;
					externalCall('ScratchExtensions.loadExternalJS', null, url);
				}

				var d:DialogBox = new DialogBox(loadJSExtension);
				d.addTitle('Load Javascript Scratch Extension');
				d.addField('URL', 120);
				d.addAcceptCancelButtons('Load');
				d.showOnStage(app.stage);
			});
		}
	}

	function showEditMenu(b:*) {
		var m:Menu = new Menu(null, 'More', CSS.topBarColor(), 28);
		m.addItem('Undelete', runtime.undelete, runtime.canUndelete());
		m.addLine();
		m.addItem('Small stage layout', toggleSmallStage, true, stageIsContracted);
		m.addItem('Turbo mode', toggleTurboMode, true, interp.turboMode);
		addEditMenuItems(b, m);
		var p:Point = b.localToGlobal(new Point(0, 0));
		m.showOnStage(stage, b.x, topBarPart.bottom() - 1);
	}

	protected function addEditMenuItems(b:*, m:Menu) {
		m.addLine();
		m.addItem('Edit block colors', editBlockColors);
	}

	protected function editBlockColors() {
		var d:DialogBox = new DialogBox();
		d.addTitle('Edit Block Colors');
		d.addWidget(new BlockColorEditor());
		d.addButton('Close', d.cancel);
		d.showOnStage(stage, true);
	}

	protected function canExportInternals() {
		return false;
	}

	private function showAboutDialog() {
		DialogBox.notify(
				'Scratch 2.0 ',
				'\n\nCopyright © 2012 MIT Media Laboratory' +
				'\nAll rights reserved.' +
				'\n\nPlease do not distribute!', stage);
	}

	protected function onNewProject() {}

	protected function createNewProjectAndThen(callback:Function = null) {
		function clearProject() {
			startNewProject('', '');
			setProjectName('Untitled');
			onNewProject();
			topBarPart.refresh();
			stagePart.refresh();
			if (callback != null) callback();
		}
		saveProjectAndThen(clearProject);
	}

	protected function createNewProject(ignore:* = null) {
		createNewProjectAndThen();
	}

	protected function createNewProjectScratchX(jsCallback:Array) {
		createNewProjectAndThen(function() {
			externalCallArray(jsCallback);
		});
	}

	protected function saveProjectAndThen(postSaveAction:Function = null) {
		// Give the user a chance to save their project, if needed, then call postSaveAction.
		function doNothing() {
		}

		function cancel() {
			d.cancel();
		}

		function proceedWithoutSaving() {
			d.cancel();
			postSaveAction()
		}

		function save() {
			d.cancel();
			exportProjectToFile(false, postSaveAction);
		}

		if (postSaveAction == null) postSaveAction = doNothing;
		if (!saveNeeded) {
			postSaveAction();
			return;
		}
		var d:DialogBox = new DialogBox();
		d.addTitle('Save project?');
		d.addButton('Save', save);
		d.addButton('Don\'t save', proceedWithoutSaving);
		d.addButton('Cancel', cancel);
		d.showOnStage(stage);
	}

	function exportProjectToFile(fromJS = false, saveCallback:Function = null) {
		function squeakSoundsConverted() {
			scriptsPane.saveScripts(false);
			var projectType = extensionManager.hasExperimentalExtensions() ? '.sbx' : '.sb2';
			var defaultName = StringUtil.trim(projectName());
			defaultName = ((defaultName.length > 0) ? defaultName : 'project') + projectType;
			var zipData:ByteArray = projIO.encodeProjectAsZipFile(stagePane);
			var file:FileReference = new FileReference();
			file.addEventListener(Event.COMPLETE, fileSaved);
			file.save(zipData, fixFileName(defaultName));
		}

		function fileSaved(e:Event) {
			if (!fromJS) setProjectName(e.target.name);
			if (isExtensionDevMode) {
				// Some versions of the editor think of this as an "export" and some think of it as a "save"
				saveNeeded = false;
			}
			if (saveCallback != null) saveCallback();
		}

		if (loadInProgress) return;
		var projIO:ProjectIO = new ProjectIO(this);
		projIO.convertSqueakSounds(stagePane, squeakSoundsConverted);
	}

	static function fixFileName(s) {
		// Replace illegal characters in the given string with dashes.
		const illegal = '\\/:*?"<>|%';
		var result = '';
		for (var i = 0; i < s.length; i++) {
			var ch = s.charAt(i);
			if ((i == 0) && ('.' == ch)) ch = '-'; // don't allow leading period
			result += (illegal.indexOf(ch) > -1) ? '-' : ch;
		}
		return result;
	}

	function saveSummary() {
		var name = (projectName() || "project") + ".txt";
		var file:FileReference = new FileReference();
		file.save(stagePane.getSummary(), fixFileName(name));
	}

	function toggleSmallStage() {
		setSmallStageMode(!stageIsContracted);
	}

	function toggleTurboMode() {
		interp.turboMode = !interp.turboMode;
		stagePart.refresh();
	}

	function handleTool(tool, evt:MouseEvent) {
	}

	function showBubble(text, x:* = null, y:* = null, width = 0) {
		if (x == null) x = stage.mouseX;
		if (y == null) y = stage.mouseY;
		gh.showBubble(text, Number(x), Number(y), width);
	}

	// TODO: calculate field width for up to 40 hex digits of CSS.normalTextFont
	protected const kGitHashFieldWidth = 7 * 41;
	protected function makeVersionDetailsDialog():DialogBox {
		var d:DialogBox = new DialogBox();
		d.addTitle('Version Details');
		d.addField('GPU enabled', kGitHashFieldWidth, SCRATCH::allow3d);
		d.addField('scratch-flash', kGitHashFieldWidth, SCRATCH::revision);
		return d;
	}

	protected function showVersionDetails() {
		var versionDetailsBox:DialogBox = makeVersionDetailsDialog();
		versionDetailsBox.addButton('OK', versionDetailsBox.accept);
		versionDetailsBox.showOnStage(stage);
	}

	// -----------------------------
	// Project Management and Sign in
	//------------------------------

	function setLanguagePressed(b:IconButton) {
		function setLanguage(lang) {
			Translator.setLanguage(lang);
			languageChanged = true;
		}

		if (Translator.languages.length == 0) return; // empty language list
		var m:Menu = new Menu(setLanguage, 'Language', CSS.topBarColor(), 28);
		if (b.lastEvent.shiftKey) {
			m.addItem('import translation file');
			m.addItem('set font size');
			m.addLine();
		}
		for each (var entry:Array in Translator.languages) {
			m.addItem(entry[1], entry[0]);
		}
		var p:Point = b.localToGlobal(new Point(0, 0));
		m.showOnStage(stage, b.x, topBarPart.bottom() - 1);
	}

	function startNewProject(newOwner, newID) {
		runtime.installNewProject();
		projectOwner = newOwner;
		projectID = newID;
		projectIsPrivate = true;
	}

	// -----------------------------
	// Save status
	//------------------------------

	var saveNeeded;

	function setSaveNeeded(saveNow = false) {
		saveNow = false;
		// Set saveNeeded flag and update the status string.
		saveNeeded = true;
		if (!wasEdited) saveNow = true; // force a save on first change
		clearRevertUndo();
	}

	protected function clearSaveNeeded() {
		// Clear saveNeeded flag and update the status string.
		function twoDigits(n) {
			return ((n < 10) ? '0' : '') + n
		}

		saveNeeded = false;
		wasEdited = true;
	}

	// -----------------------------
	// Project Reverting
	//------------------------------

	protected var originalProj:ByteArray;
	private var revertUndo:ByteArray;

	function saveForRevert(projData:ByteArray, isNew, onServer = false) {
		originalProj = projData;
		revertUndo = null;
	}

	protected function doRevert() {
		runtime.installProjectFromData(originalProj, false);
	}

	protected function revertToOriginalProject() {
		function preDoRevert() {
			revertUndo = new ProjectIO(Scratch.app).encodeProjectAsZipFile(stagePane);
			doRevert();
		}

		if (!originalProj) return;
		DialogBox.confirm('Throw away all changes since opening this project?', stage, preDoRevert);
	}

	protected function undoRevert() {
		if (!revertUndo) return;
		runtime.installProjectFromData(revertUndo, false);
		revertUndo = null;
	}

	protected function canRevert() {
		return originalProj != null
	}

	protected function canUndoRevert() {
		return revertUndo != null
	}

	private function clearRevertUndo() {
		revertUndo = null
	}

	function addNewSprite(spr:ScratchSprite, showImages = false, atMouse = false) {
		var c:ScratchCostume, byteCount;
		for each (c in spr.costumes) {
			if (!c.baseLayerData) c.prepareToSave()
			byteCount += c.baseLayerData.length;
		}
		if (!okayToAdd(byteCount)) return; // not enough room
		spr.objName = stagePane.unusedSpriteName(spr.objName);
		spr.indexInLibrary = 1000000; // add at end of library
		spr.setScratchXY(int(200 * Math.random() - 100), int(100 * Math.random() - 50));
		if (atMouse) spr.setScratchXY(stagePane.scratchMouseX(), stagePane.scratchMouseY());
		stagePane.addChild(spr);
		spr.updateCostume();
		selectSprite(spr);
		setTab(showImages ? 'images' : 'scripts');
		setSaveNeeded(true);
		libraryPart.refresh();
		for each (c in spr.costumes) {
			if (ScratchCostume.isSVGData(c.baseLayerData)) c.setSVGData(c.baseLayerData, false);
		}
	}

	function addSound(snd:ScratchSound, targetObj:ScratchObj = null) {
		if (snd.soundData && !okayToAdd(snd.soundData.length)) return; // not enough room
		if (!targetObj) targetObj = viewedObj();
		snd.soundName = targetObj.unusedSoundName(snd.soundName);
		targetObj.sounds.push(snd);
		setSaveNeeded(true);
		if (targetObj == viewedObj()) {
			soundsPart.selectSound(snd);
			setTab('sounds');
		}
	}

	function addCostume(c:ScratchCostume, targetObj:ScratchObj = null) {
		if (!c.baseLayerData) c.prepareToSave();
		if (!okayToAdd(c.baseLayerData.length)) return; // not enough room
		if (!targetObj) targetObj = viewedObj();
		c.costumeName = targetObj.unusedCostumeName(c.costumeName);
		targetObj.costumes.push(c);
		targetObj.showCostumeNamed(c.costumeName);
		setSaveNeeded(true);
		if (targetObj == viewedObj()) setTab('images');
	}

	function okayToAdd(newAssetBytes) {
		// Return true if there is room to add an asset of the given size.
		// Otherwise, return false and display a warning dialog.
		const assetByteLimit = 50 * 1024 * 1024; // 50 megabytes
		var assetByteCount = newAssetBytes;
		for each (var obj:ScratchObj in stagePane.allObjects()) {
			for each (var c:ScratchCostume in obj.costumes) {
				if (!c.baseLayerData) c.prepareToSave();
				assetByteCount += c.baseLayerData.length;
			}
			for each (var snd:ScratchSound in obj.sounds) assetByteCount += snd.soundData.length;
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
	}

	// -----------------------------
	// Flash sprite (helps connect a sprite on the stage with a sprite library entry)
	//------------------------------

	function flashSprite(spr:ScratchSprite) {
		function doFade(alpha) {
			box.alpha = alpha
		}

		function deleteBox() {
			if (box.parent) {
				box.parent.removeChild(box)
			}
		}

		var r:Rectangle = spr.getVisibleBounds(this);
		var box:Shape = new Shape();
		box.graphics.lineStyle(3, CSS.overColor, 1, true);
		box.graphics.beginFill(0x808080);
		box.graphics.drawRoundRect(0, 0, r.width, r.height, 12, 12);
		box.x = r.x;
		box.y = r.y;
		addChild(box);
		Transition.cubic(doFade, 1, 0, 0.5, deleteBox);
	}

	// -----------------------------
	// Download Progress
	//------------------------------

	function addLoadProgressBox(title) {
		removeLoadProgressBox();
		lp = new LoadProgress();
		lp.setTitle(title);
		stage.addChild(lp);
		fixLoadProgressLayout();
	}

	function removeLoadProgressBox() {
		if (lp && lp.parent) lp.parent.removeChild(lp);
		lp = null;
	}

	private function fixLoadProgressLayout() {
		if (!lp) return;
		var p:Point = stagePane.localToGlobal(new Point(0, 0));
		lp.scaleX = stagePane.scaleX;
		lp.scaleY = stagePane.scaleY;
		lp.x = int(p.x + ((stagePane.width - lp.width) / 2));
		lp.y = int(p.y + ((stagePane.height - lp.height) / 2));
	}

	// -----------------------------
	// Camera Dialog
	//------------------------------

	function openCameraDialog(savePhoto:Function) {
		closeCameraDialog();
		cameraDialog = new CameraDialog(savePhoto);
		cameraDialog.fixLayout();
		cameraDialog.x = (stage.stageWidth - cameraDialog.width) / 2;
		cameraDialog.y = (stage.stageHeight - cameraDialog.height) / 2;
		addChild(cameraDialog);
	}

	function closeCameraDialog() {
		if (cameraDialog) {
			cameraDialog.closeDialog();
			cameraDialog = null;
		}
	}

	// Misc.
	function createMediaInfo(obj:*, owningObj:ScratchObj = null):MediaInfo {
		return new MediaInfo(obj, owningObj);
	}

	static function loadSingleFile(fileLoaded:Function, filter:FileFilter = null) {
		function fileSelected(event:Event) {
			if (fileList.fileList.length > 0) {
				var file:FileReference = FileReference(fileList.fileList[0]);
				file.addEventListener(Event.COMPLETE, fileLoaded);
				file.load();
			}
		}

		var fileList:FileReferenceList = new FileReferenceList();
		fileList.addEventListener(Event.SELECT, fileSelected);
		try {
			// Ignore the exception that happens when you call browse() with the file browser open
			fileList.browse(filter != null ? [filter] : null);
		} catch (e:*) {
		}
	}

	// -----------------------------
	// External Interface abstraction
	//------------------------------

	function externalInterfaceAvailable() {
		return ExternalInterface.available;
	}

	function externalCall(functionName, returnValueCallback:Function = null, ...args) {
		args.unshift(functionName);
		var retVal:*;
		try {
			retVal = ExternalInterface.call.apply(ExternalInterface, args);
		}
		catch (e:Error)
		{
			logException(e);
			// fall through to below
		}
		if (returnValueCallback != null) {
			returnValueCallback(retVal);
		}
	}

	function addExternalCallback(functionName, closure:Function) {
		ExternalInterface.addCallback(functionName, closure);
	}

	// jsCallbackArray is: [functionName, arg1, arg2...] where args are optional.
	// TODO: rewrite all versions of externalCall in terms of this
	function externalCallArray(jsCallbackArray:Array, returnValueCallback:Function = null) {
		var args:Array = jsCallbackArray.concat(); // clone
		args.splice(1, 0, returnValueCallback);
		externalCall.apply(this, args);
	}
}
}
