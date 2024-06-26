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

    var Box_No_Arr = [];
    var Box_No_List = [];

    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
        if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
           screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
	};

	// 이벤트 초기화
	var setInitEvent = function() {
		$("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
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

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                // 부품식별표 중복 스캔 체크
                Box_No_Arr.forEach(function(arr){
                    if(rowData.BOX_NO == arr){
                        bar_exists = true;
                    }
                });
                if(!bar_exists){
                    Box_No_Arr.push(rowData.BOX_NO);
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                var tag = "";
                var template = $("#ListTemplate").html();
                var exists = false;

                $("#list_kd_075 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);

                        exists = true;
                    }
                });
                if(!exists){
                    $("#list_kd_075_head").removeClass("blind");
                    tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.BAR_QTY)
                                   .replace(/\{\{BOX_QTY\}\}/, 1)
                                   .replace(/\{\{LOC_TP_TYPE\}\}/, rowData.LOC_TP_TYPE)
                                   .replace(/\{\{WH_CD\}\}/, rowData.WH_CD)
                                   .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                   .replace(/\{\{MAKE_SEQ\}\}/gi, rowData.MAKE_SEQ)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                                   .replace(/\{\{BASIC_UNIT\}\}/, rowData.BASIC_UNIT)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                                   .replace(/\{\{BOX_IN_QTY\}\}/, rowData.BOX_IN_QTY)
                                   .replace(/\{\{BOX_OUT_FLAG\}\}/, rowData.BOX_OUT_FLAG)
                                   .replace(/\{\{DELI_NO\}\}/, rowData.DELI_NO)
                                   .replace(/\{\{HOLD_FLAG\}\}/, rowData.HOLD_FLAG);
                    $("#list_kd_075").prepend(tag);
                }
                Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":rowData.PLANT_CD, "LOC_TP":rowData.LOC_TP, "WH_CD":rowData.WH_CD, "BOX_NO":rowData.BOX_NO, "PART_CD":rowData.PART_CD, "BAR_QTY":rowData.BAR_QTY,  "USER_ID":getUSER_ID, "RTN_MSG":"" })
                $("#inputScan").focus();
            }
        });
    };

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        var save_Chk = true;

        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        save();
    }

    // 사외 창고 실사 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_075_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_075").html("");
        $("#list_kd_075_head").addClass("blind");
        $("#inpBoxQty").text("0");

        Box_No_Arr.length=0;
        Box_No_List.length=0;
        saveflag = false;
    }

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {

	};

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent
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