/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
	// 화면 초기화
	var setInitScreen = function() {
	    popupManager.instance("미구현", {showtime:"SHORT"});
	    moveToBack();
	};

	var setInitEvent = function() {
	    $(".btn_close").on("click", moveToBack);
    };

	var moveToBack = function() {
		screenManager.moveToBack({ animation: "SLIDE_BOTTOM" });
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack
	};
})(window, document, $, M);

/*******************************************************************
*	MCore Common Events
*******************************************************************/
M.onReady(function(e) {
	page.setInitScreen();
	page.setInitEvent();
}).onHide(function(e){
	// 화면 이동 전에 호출
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});