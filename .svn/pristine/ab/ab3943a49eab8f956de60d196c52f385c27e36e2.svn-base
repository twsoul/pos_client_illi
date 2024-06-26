/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var PLANT_CD = "";
    var PART_NO = "";
    var PART_NM = "";
    var BOX_CNT = "";

    var saveflag = false;
    var Box_No_List = [];

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        // 이전 화면에서 전송한 데이터
        PLANT_CD = dataManager.param("PLANT_CD");
        PART_NO = dataManager.param("PART_NO");
        PART_NM = dataManager.param("PART_NM");
        BOX_CNT = dataManager.param("BOX_CNT");

        // 리스트 정보 set
        BoxNoSet();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
	    // 출고 BOX 수량 조절 버튼 이벤트
    	$(".fixedArea2 .table_area p").on("click", function() {
    	    $("#txtOTBox_cnt").text(parseInt($("#txtOTBox_cnt").text()) + parseInt($(this).text()));
    	    if(parseInt($("#txtOTBox_cnt").text()) < 0) { // 출고 수량이 0미만인 경우
                $("#txtOTBox_cnt").text(0);
    	    }
    	    if(parseInt($("#txtOTBox_cnt").text()) > parseInt($("#txtSCAN_BOX_CNT").text())){ // 출고 수량이 박스 수량보다 많을 경우
    	        $("#txtOTBox_cnt").text(parseInt($("#txtSCAN_BOX_CNT").text()));
    	    }
    	});

        // 저장 버튼 클릭 시
    	$("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
            setClearClickEvent();
        })
	};

    // 출고 지시할 부품식별표 조회
	var BoxNoSet = function(){
	    networkManager.httpSend({
	        server: saveUserCo,
            path: 'api/OT_101_S1.do',
            data: {
                'PLANT_CD': PLANT_CD,
                'PART_CD': PART_NO,
                'LANG':getLNG
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_cnt = 0;

                $("#txtPLANT_CD").text(PLANT_CD);
                $("#txtPART_NO").text(PART_NO);
                $("#txtPART_NM").text(PART_NM);

                $("#txtINV_QTY").text(rowData.BOX_QTY);
                $("#txtSCAN_BOX_CNT").text(rowData.BOX_CNT);
                $("#txtTOT_QTY").text(rowData.TOT_CNT);
            }
        });
	}

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        var nExpCnt = parseInt($("#txtOTBox_cnt").text());
        var nBoxCnt = parseInt($("#txtSCAN_BOX_CNT").text());

        if(nExpCnt <=0){
            popupManager.instance($("[data-lng='MSG.0000000259']").text(), {showtime:"LONG"}); // 출고BOX수량이 0 이상이어야 합니다
            return;
        }
        if(nExpCnt > nBoxCnt){
            popupManager.instance($("[data-lng='MSG.0000000260']").text(), {showtime:"LONG"}); // 출고BOX수량이 재고BOX수량보다 큽니다
            return;
        }

        Box_No_List.push({"PLANT_CD":PLANT_CD,"PART_CD":PART_NO, "EXP_CNT":$("#txtOTBox_cnt").text(), "RTN_MSG":""});

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        saveMsg();
    }

    var saveMsg = function(){
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_101_S2.do',
            data: {
                'PLANT_CD':PLANT_CD,
                'PART_CD':PART_NO,
                'EXP_CNT':$("#txtOTBox_cnt").text(),
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var result = rowData.RTN_MSG;

                console.log("RTN_MSG : "+rowData.RTN_MSG);

                if(result.substr(0,1)=="S"){
                    console.log("S");
                    console.log("RTN_MSG : "+rowData.RTN_MSG);
                    save();
                } else if(result.substr(0,1)=="E"){
                    popupManager.alert(rowData.RTN_MSG, {
                        title: $("[data-lng='MSG.0000000004']").text(), // 알림
                        buttons:[$("[data-lng='MSG.0000000002']").text()] // 확인
                    }, function() {
                        saveflag = false;
                        return;
                    });
                }


                console.log("RTN_MSG : "+rowData.RTN_MSG);

            }
        });
    }

    var save = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_101_I1.do',
            data: {
                'PART_CD':PART_NO,
                'EXP_CNT':$("#txtOTBox_cnt").text()
            },
            success: function(receivedData, setting) {
                popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                clear();
                moveToBack();
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                clear();
                moveToBack();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function(){
        $("#txtOTBox_cnt").text(0);
        Box_No_List.length = 0;
        saveflag = false;
    }

	var moveToBack = function() {
		screenManager.moveToBack();
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