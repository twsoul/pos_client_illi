/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        $("#inputScan").focus();
	};

	// 이벤트 초기화
    var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });
    };



    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        if(inputScan.length > 0) {
            clear();
            TmScan(inputScan);
        }
    }

    // TM 조회 함수
    var TmScan = function(tm_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_150_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'TM_NO':tm_no,
                'LANG': getLNG
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000432']").text(), {showtime:"LONG"}); // TM_NO가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtTM_NO").text(rowData.TM_NO);
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtSERIAL_NO").text(rowData.SERIAL_NO);
                $("#txtPART_NM").text(rowData.PART_NM);
                $("#txtVENDOR_NM").text(rowData.VENDOR_NM);
                $("#txtPLT_NO").text(rowData.PLT_NO);
                $("#txtUSE_FLAG").text(rowData.USE_FLAG);
                $("#txtHOLD_FLAG").text(rowData.HOLD_FLAG);
                $("#txtPLANT_CD").text(rowData.PLANT_CD);
                $("#txtLOC_TP").text(rowData.LOC_TP);
                $("#txtTRANS_TYPE").text(rowData.TRANS_TYPE_NM);
                $("#txtTRANS_KEY").text(rowData.TRANS_KEY);


                $("#inputScan").focus();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    var clear = function(){
        $("#txtTM_NO").text("");
        $("#txtPART_CD").text("");
        $("#txtSERIAL_NO").text("");
        $("#txtPART_NM").text("");
        $("#txtVENDOR_NM").text("");
        $("#txtPLT_NO").text("");
        $("#txtUSE_FLAG").text("");
        $("#txtHOLD_FLAG").text("");
        $("#txtPLANT_CD").text("");
        $("#txtLOC_TP").text("");
        $("#txtTRANS_TYPE").text("");
        $("#txtTRANS_KEY").text("");
        $("#inputScan").focus();
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
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});