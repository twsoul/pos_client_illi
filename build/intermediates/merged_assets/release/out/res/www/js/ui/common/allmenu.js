/*******************************************************************
*	메인 페이지 로직
*******************************************************************/
var page = (function(window, document, $, M, undefined) {
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        $(".user li button").first().html(getUSER_NM);
        getPdaMenuList();
	};

	var getPdaMenuList = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/MenuList.do',
        	data: {
        		'ID': getUSER_ID
        	},
        	success: function(receivedData, setting) {
        		$.each(receivedData.ListData, function(index,rowData){
                    $("."+rowData.SCR_ID).removeClass("blind");
                    /*if(rowData.SCR_ID == "S90000819") {
                        $(".commonOpt").addClass("blind");
                    }*/
        		});
        	}
        });
    }

	// 이벤트 초기화
	var setInitEvent = function() {
	    var url = dataManager.param('url'),
                    substrIdx = url.indexOf('/html'),
                    pageName = url.substring(substrIdx+6, url.length),
                    pageFolder = pageName.substr(0, pageName.indexOf('/'));

		// 전체 메뉴 닫기 버튼 클릭시*/
		$(".btn_close").on("click", moveToBack);
        // 각 메뉴 클릭시 페이지 이동
        $(".allmenu_pop [data-page-name] button").click(function(){
        	var clickPage = $(this).parent().attr('data-page-name').substr(3,$(this).parent().attr('data-page-name').length-1);
        	var clickFolder =clickPage.substr(0,clickPage.indexOf('/'));
        	if(pageName != clickPage){
        		var directPage = $(this).parent().attr('data-page-name');
        		setTimeout(function(){
        			M.page.html(directPage,{
        				action:"NEW_SCR",
        				orient:"PORT"
        			});
        		}, 600);
        	}else{
        		$(".btn_close").click();
        	}
        });
	};

	var mainMovePage = function() {
		var page = $(this).data("page");
		if (page != "")
			screenManager.moveToPage(page);
	};

	var moveToBack = function() {
		screenManager.moveToBack({
		    animation: "SLIDE_BOTTOM"
		});
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