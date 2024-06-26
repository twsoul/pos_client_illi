
(function(window, undefined) {

var 
thisFileName = "mcore.extends.js",

importFiles = [
	"wnInterface.extends.js",
	'libs/jquery/jquery.min.js',
	'libs/moment/moment.min.js',
	'libs/instance/instance.ui.min.js',
	'libs/muikit/muikit-1.0.0.min.js',
	'libs/bootstrap/bootstrap.min.js',
	'libs/underscore/underscore-min.js',
	'libs/iscroll/iscroll-zoom.js',
	'libs/jquery-ui/jquery-ui.min.js',
	'libs/jquery-ui/jquery-ui-touch.min.js',
	'libs/barcode/jquery-barcode.min.js',
	'libs/barcode/jquery.qrcode.js',
	'libs/barcode/qrcode.js',
	'libs/push/push.manager.js',
	"common/constant.js",
	"common/interfaceWrapper.js",
	'common/pushCommon.js',
	'common/userManager.js',
	'common/optionManager.js',
	"common/common.js",
	"common/utils.js",
	"common/upperManager.js"
];

M.ScriptLoader.writeScript( importFiles, M.ScriptLoader.scriptPath(thisFileName) );
})(window);