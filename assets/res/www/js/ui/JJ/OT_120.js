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

    var saveflag = false;
    var listChk = false;
    var over_chk = false;
    var ban_chk = false;
    var plantChk = "";

    var Box_No_Arr = [];
    var Box_BarCode_Arr = [];
    var Tot_Line_Qty = 0;
    var Tot_Scan_Qty = 0;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
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
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
            sel_Ban_Set();
        })

        // 저장위치 변경 시 라인 콤보박스 신규 호출
        $("#selLOCTP").on('change', function() {
            plantChk = $("#selPLANT option:selected").attr('value1');
            if(plantChk != "Y"){
                LineListSet();
            }
            sel_Line_Set();
        })

        // 반 변경 시 라인 콤보박스 신규 호출
        $("#selBAN").on('change', function() {
            if($("#selBAN").val() == ""){
                LineListSet();
            } else {
                ban_chk = true;
                clear();
            }
            sel_Line_Set();
        })

        // 라인 변경 시 라인 리스트 신규 호출
        $("#selLINE").on('change', function() {
            LineListSet();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            setClearClickEvent();
        })


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
                        tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.LINE_CD_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);

                    StorageLocationReq();
                    sel_Ban_Set();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': ["30"]
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLOCTP").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
            }
        });
        $("#inputScan").focus();
    }

    // 반 콤보박스 정보 조회
    var sel_Ban_Set = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/AreaCodeList2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'PART_CD':"",
                'event':'반 정보 조회'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selBAN").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.AREA_CD + "'>" + rowData.AREA_NM + "</option>";
                    });
                }
                $("#selBAN").append(tag);
                sel_Line_Set();
            }
        });
        $("#inputScan").focus();
    }

    // 라인 콤보 박스 정보 조회
    var sel_Line_Set = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'AREA_CD': $("#selBAN").val(),
                'PART_CD': "",
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                var tag = "";
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                $("#selLINE").html("");
                if(receivedData.ListCount != 0){

                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    });
                }
                $("#selLINE").append(tag);
            }
        });
        $("#inputScan").focus();
    }

    // 부품식별표 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        if(userPlantCheck == null){
             popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
             $("#inputScan").focus();
             return;
        }

        if(inputScan.length > 0) {
            if(!listChk){
                popupManager.instance($("[data-lng='MSG.0000000279']").text(), {showtime:"LONG"}); // 라인 정보가 존재하지 않습니다
                $("#inputScan").focus();
                return;
            }
            BoxNoScan(inputScan);
        }

    }

    // 라인입고 정보 조회 함수
    var LineListSet = function(){
        plantChk = $("#selPLANT option:selected").attr('value1');

        if($("#selLOCTP").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            $("#selLINE").val("").prop("selected", true);
            return;
        }
        if($("#selLINE").val() == "" && plantChk == "Y"){
            clear();
            return;
        }

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_120_S1.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'LOC_TP': $("#selLOCTP").val(),
                'LINE_CD': $("#selLINE").val(),
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000328']").text(), {showtime:"LONG"}); // 입고 정보가 존재하지 않습니다
                    clear();
                    return;
                }

                $("#list_ot_120_head").removeClass("blind");
                $("#list_ot_120").html("");
                listChk = true;

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, "0")
                                   .replace(/\{\{BOX_QTY\}\}/, "0");
                    $("#list_ot_120").append(tag);
                    Tot_Line_Qty += parseInt(rowData.BAR_QTY);
                });
            }
        });
        $("#inputScan").focus();
    };

    // 부품식별표 조회 함수
    var BoxNoScan = function(boxBarCode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_120_S2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'LOC_TP': $("#selLOCTP").val(),
                'LINE_CD': $("#selLINE").val(),
                'BOX_BAR_NO':boxBarCode,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                var insp_flag = "";
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

                $("#list_ot_120 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                    }
                });
                Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":rowData.PLANT_CD, "FR_LOC_TP":rowData.LOC_TP, "LOC_TP":$("#selLOCTP").val(), "LINE_CD":$("#selLINE").val(),"BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "SCAN_QTY":rowData.BAR_QTY, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                $("#inputScan").focus();
            }
        });

    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    // 라인입고 저장
    var save = function(){
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_120_C1.do',
            data: {
                'param1': Box_BarCode_Arr
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
        if(ban_chk){
            ban_chk = false;
            $("#list_ot_120_head").addClass("blind");
            $("#inpBoxQty").text("0");
            $("#list_ot_120").html("");
            listChk = false;
            over_chk = false;
            saveflag = false;
            Box_No_Arr.length = 0;
            Box_BarCode_Arr.length = 0;
            $("#inputScan").focus();
            return;
        }

        $("#list_ot_120_head").addClass("blind");

        StorageLocationReq();
        sel_Ban_Set();


        $("#inpBoxQty").text("0");

        $("#list_ot_120").html("");
        listChk = false;
        over_chk = false;

        Tot_Scan_Qty = 0;
        Tot_Line_Qty = 0;

        Box_No_Arr.length = 0;
        Box_BarCode_Arr.length = 0;
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