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

    var Box_No_Arr = [];
    var C1_LIST = [];

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
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

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
        });

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function() {
            WHReq();
        });

        // 저장위치 변경 시 스캔 포커스
        $("#selWHCD").on('change', function() {
            $("#inputScan").focus();
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        });

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            setClearClickEvent();
        });
	};

	// 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/PlantCodeList.do',
    		data: {
            	'LANG': getLNG,
            	'WERKS': getCORP_CD
            },
    		success: function(receivedData, setting) {
    		    $("#selPLANT").html("");
    		    if(receivedData.ListCount == 0){
    		        popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
    		    }else{
    		        var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                    	tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq();
    		    }
    		}
    	});
    };

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["40"]
            },
        	success: function(receivedData, setting) {
                var tag = "";
                $("#selLOCTP").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                WHReq();
        	}
        });
        $("#inputScan").focus();
    }

    // 변경창고 콤보박스 정보 조회
    var WHReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/selectWHCode.do',
        	data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val()
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selWHCD").html("");
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.WH_CD + "'>" + rowData.WH_NM + "</option>";
                     });
                }
                $("#selWHCD").append(tag);
        	}
        });
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치을 먼저 선택하십시오
            return;
        }
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
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000507']").text(), {showtime:"LONG"}); // 입하상태이므로 불출할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtWHCD").text(rowData.WH_NM == undefined ? "" : rowData.WH_NM);

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

                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                var tag = "";
                var template = $("#ListTemplate").html();
                var exists = false;

                $("#list_kd_020 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);

                        exists = true;
                    }
                });
                if(!exists){
                    $("#list_kd_020_head").removeClass("blind");
                    tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
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
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.BAR_QTY)
                                   .replace(/\{\{BOX_QTY\}\}/, 1)
                                   .replace(/\{\{DELI_NO\}\}/, rowData.DELI_NO)
                                   .replace(/\{\{HOLD_FLAG\}\}/, rowData.HOLD_FLAG);
                    $("#list_kd_020").prepend(tag);
                }
                C1_LIST.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":rowData.PLANT_CD, "LOC_TP":rowData.LOC_TP, "BOX_NO":rowData.BOX_NO, "WH_CD":rowData.WH_CD, "TO_WH_CD":"", "PART_CD":rowData.PART_CD, "VENDOR_CD":rowData.VENDOR_CD, "BAR_QTY":rowData.BAR_QTY,  "USER_ID":getUSER_ID, "RTN_MSG":"" });
                $("#inputScan").focus();
            }
        });
    };

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userWhCheck = $("#selWHCD").val();
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(userWhCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000423']").text(), {showtime:"LONG"}); // 변경창고 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        $.each(C1_LIST,function(key){
             C1_LIST[key]['TO_WH_CD'] = userWhCheck;
        });

        save();

    }

    // PR_PDA_KD_020_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_020_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    clear();
                }
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        console.log("clear");

        $("#list_kd_020").html("");
        $("#txtWHCD").html("");
        $("#list_kd_020_head").addClass("blind");

        Box_No_Arr.length = 0;
        C1_LIST.length = 0;

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#inpBoxQty").text("0");
        saveflag = false;
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
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});