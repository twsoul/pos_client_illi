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

    var listChk = false;

    var Box_No_Arr = [];
    var Box_BarCode_Arr = [];

    var saveflag = false;

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
            clear();
            StorageLocationReq();
        })

        // 저장위치 변경 시 라인 콤보박스 신규 호출
        $("#selLOCTP").on('change', function() {
            PlantListSet();
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
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);

                    StorageLocationReq();
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
                'TYPE': ["10"]
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
        $("#inputScan").focus();;
    }

    // 플랜트 이동입고 정보 조회 함수
    var PlantListSet = function(){
        // 선택 항목 선택 시
        if($("#selLOCTP").val() == ""){
            clear();
            return;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_030_S1.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'LOC_TP': $("#selLOCTP").val(),
                'event':'플랜트 이동입고 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000328']").text(), {showtime:"LONG"}); // 입고 정보가 존재하지 않습니다
                    clear();
                    return;
                }
                $("#inpBoxQty").text(0);
                $("#list_in_030_head").removeClass("blind");
                $("#list_in_030").html("");
                listChk = true;

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, "0")
                                   .replace(/\{\{BOX_QTY\}\}/, "0");
                    $("#list_in_030").append(tag);
                });
                $("#inputScan").focus();
            }
        });
    };

    // 부품식별표 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
             popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
             $("#inputScan").focus();
             return;
        }
        if(userLocTpCheck == ""){
             popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
             $("#inputScan").focus();
             return;
        }

        if(inputScan.length > 0) {
            if(!listChk){
                popupManager.instance($("[data-lng='MSG.0000000328']").text(), {showtime:"LONG"}); // 입고 정보가 존재하지 않습니다
                $("#inputScan").focus();
                return;
            }
            BoxNoScan(inputScan);
        }

    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(boxBarCode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_030_S2.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'LOC_TP': $("#selLOCTP").val(),
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
                    return;
                }

                $("#list_in_030 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                    }
                });
                Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"FR_PLANT_CD":rowData.PLANT_CD, "FR_LOC_TP":rowData.LOC_TP, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "SCAN_QTY":rowData.BAR_QTY, "BOX_NO":rowData.BOX_NO, "PART_CD":rowData.PART_CD, "VENDOR_CD":rowData.VENDOR_CD, "WORK_ID":getUSER_ID, "WORK_NM":getUSER_NM, "RTN_MSG":""});
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

        $.each(Box_BarCode_Arr,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // 플랜트 이동 입고 저장
    var save = function(){
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_IN_030_C1.do',
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

    var clear = function() {
        $("#list_in_030_head").addClass("blind");
        $("#selLOCTP").val("").prop("selected", true);
        listChk = false;
        $("#list_in_030").html("");
        $("#inpBoxQty").text("0");

        Box_No_Arr.length = 0;
        Box_BarCode_Arr.length = 0;
        saveflag = false;
        $("#inputScan").focus();
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