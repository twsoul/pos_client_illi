/*******************************************************************
*	메인 페이지 로직
*******************************************************************/
var version;
var page = (function(window, document, $, M, undefined) {
	console.log("page");
    //setTimeout('location.reload()', 3000);
	// 화면 초기화
	var setInitScreen = function() {
	console.log("setInitScreen");
	    version = exWNVersionInfo();
    	// 1. app version check
    	appVersionCheck();
    	// 2. 메뉴 리스트 불러오기
    	getPdaMenuList();
	};
    $("#wrapper").on("click", function() {
        debugger;
        console.log("wrapper");
        appVersionCheck();
		});
	// 이벤트 초기화
	var setInitEvent = function() {
		//$(".clearfix li").on("click", mainMovePage);
		//$("#btn_logout").on("click", logoutProcess);
	};

	// 자식창에 갔다가 돌아왔을때 리로드용
    var setReloadEvent = function() {
	console.log("setReloadEvent");
        exShowIndicator("");
        $.each(JSON.parse(dataManager.storage(optionManager.getLNG())), function(index,rowData){
            $("[data-lng='"+rowData.MSG_TYPE+"."+rowData.LANG_KEY+"']").text(rowData.MSG_DESC);
        });
        exHideIndicator("");
        getPdaMenuList();
    };
    // mes 용도로 따로 만들기.
    var getPdaMenuList = function() {
	console.log("getPdaMenuList");
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/MenuList.do',
        	data: {
        		'ID': getUSER_ID,
        		'LVL': "2"
        	},
        	success: function(receivedData, setting) {
        		$.each(receivedData.ListData, function(index,rowData){
        			$("."+rowData.SCR_ID).removeClass("blind");
        		});
        		userOption();
        	}
        });
    }



    var appVersionCheck = function(ok = true) {
                debugger;
	    	    exShowIndicator("");
        	    var co;
                //co = "ILST; // 일리노이
                co = "test"; // 로컬

                dataManager.storage("saveUserCo", co);

            	networkManager.httpSend({
            	    server: co,
                    path: 'api/versionCheckMes.do',
                    indicator: {show:false},
                    data: {
                    	'version': version
                    },
                    success: function(receivedData, setting) {
                    debugger;
                        if(receivedData.RESULT == "OK"){
                            //login(id, pw);
                        }else if(receivedData.RESULT == "NG"){
                            exHideIndicator("");
                            popupManager.alert($("[data-lng='update']").text(), {
                            	 title: $("[data-lng='alert']").text(),
                            	 buttons: [$("[data-lng='confirm']").text()]
                            }, function() {
                                switch(co) {
                                    case 'ILST':
                                        apkUrl = "https://pdais.hyundai-transys.com:480/"
                                    break;
                                    case 'test':
                                        //apkUrl = "http://192.168.1.106:480/"
                                        apkUrl = "http://10.130.235.22:490/"
                                    break;
                                }
                                M.apps.browser(apkUrl);
                            });
                            return;
                        }else{

                            if(ok){
                                exHideIndicator("");
                                appVersionCheck(false)
                            }else{
                                exHideIndicator("");
                                popupManager.alert($("[data-lng='noserver']").text(), {
                                  	title: $("[data-lng='alert']").text(),
                                  	buttons:[$("[data-lng='confirm']").text()]
                                }, function() {
                                	M.sys.exit();
                                });
                            }
                        }
                    },
                    error: function(errorCode, errorMessage, setting) {
                        if(ok){
                            exHideIndicator("");
                            appVersionCheck(false)
                        }else{
                            exHideIndicator("");
                            popupManager.alert($("[data-lng='noserver']").text(), {
                              	title: $("[data-lng='alert']").text(),
                              	buttons:[$("[data-lng='confirm']").text()]
                            }, function() {
                            	M.sys.exit();
                            });
                        }
                    }
                });
    }
	var mainMovePage = function() {
		var page = $(this).data("page");
		if (page != "")
			screenManager.moveToPage(page);
	};

	var moveToBack = function() {
		screenManager.moveToBack();
	};


	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent,
		sessionOut: sessionOut
	};
})(window, document, $, M);

/*******************************************************************
*	MCore Common Events
*******************************************************************/
M.onReady(function(e) {
	console.log("onReady");
	page.setInitScreen();
	page.setInitEvent();
}).onHide(function(e){
	// 화면 이동 전에 호출
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	popupManager.alert($("[data-lng='MSG.0000000005']").text(), {
    	title: $("[data-lng='MSG.0000000004']").text(),
    	buttons: [$("[data-lng='MSG.0000000003']").text(), $("[data-lng='MSG.0000000002']").text()]
    }, function(index) {
    	switch(index) {
    		case 0:
    			break;
    		case 1:
    		    page.sessionOut(true);
    			break;
    	}
    });
});