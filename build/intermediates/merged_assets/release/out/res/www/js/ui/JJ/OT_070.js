/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var no = 1;
    var Box_No_List = [];
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
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("10");
        })

        // 이동플랜트 변경 시 이동저장위치 콤보박스 신규 호출
        $("#selTOPLANT").on('change', function (e) {
            // 플랜트가 동일한경우 동일한 저장위치 선택 불가
            if($("#selPLANT").val() == $("#selTOPLANT").val()){
                StorageLocationReq("30");
            }else {
                StorageLocationReq("20");
            }

        })

        // 저장위치 변경 시 이동저장위치 콤보박스 신규 호출
        $("#selLOCTP").on('change', function (e) {
            // 플랜트가 동일한경우 동일한 저장위치 선택 불가
            if($("#selPLANT").val() == $("#selTOPLANT").val()){
                StorageLocationReq("30");
            }
            $("#inputScan").focus();
        })

        // 이동저장위치 변경 시 스캔 포커스
        $("#selTOLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
            console.log("ETC_FLAG : "+$("#selPLANT option:selected").attr('value1'));
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
                $("#selTOPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.ETC_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    $("#selTOPLANT").append(tag);
                    $("#selTOPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq("10");
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function(type) {
        var plant = "";
        if(type == "10"){
            plant = $("#selPLANT option:selected").val();
        }else if(type == "20"||type == "30"){
            plant = $("#selTOPLANT option:selected").val();
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': plant,
                'TYPE': ["10"]
            },
            success: function(receivedData, setting) {
                var tag = "";
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                if(type == "10"){ // 저장위치
                    $("#selLOCTP").html("");
                    $("#selLOCTP").append(tag);
                    if($("#selPLANT").val() == getWERKS) {
                        $("#selLOCTP").val(getLGORT).prop("selected", true);
                    }
                    $("#selTOPLANT").change();
                }else if(type == "20"){ // 이동저장위치
                    $("#selTOLOCTP").html("");
                    $("#selTOLOCTP").append(tag);
                }else{ // 플랜트가 같을 경우 이동저장위치
                    tag = "";
                    if(receivedData.ListCount != 0){
                         $.each(receivedData.ListData, function(index,rowData){
                            if(rowData.LOC_TP == $("#selLOCTP").val()){
                                return true;
                            }
                            tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                         });
                    }
                    $("#selTOLOCTP").html("");
                    $("#selTOLOCTP").append(tag);
                }
            }
        });
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_bar_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO': box_bar_no,
                'LANG':getLNG
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_no_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if($("#selPLANT option:selected").attr('value1') == "Y"){
                    if (rowData.ETC_OUT_CHK == "N") {
                        popupManager.instance($("[data-lng='MSG.0000000462']").text(), {showtime:"LONG"}); // 타용도 부품식별표입니다
                        $("#inputScan").focus();
                        return;
                    }
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 부품식별표 중복 스캔 방지
                $.each(Box_No_List,function(key,value){
                      $.each(value,function(key,value){
                            if(value == rowData.BOX_NO){
                                box_no_exists = true;
                            }
                      });
                 });

                if(box_no_exists){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔시 플랜트와 저장위치, 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 스캔마다 BOX 개수 증가
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                $("#list_ot_070_head").removeClass("blind");
                var exists = false;
                var tag = "";
                var template = $("#ListTemplate").html();

                $("#list_ot_070 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                        $(this).find(".BAR_QTY").text(parseInt($(this).find(".BAR_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                        exists = true;
                    }
                });
                if(!exists){
                    tag += template.replace(/\{\{No\}\}/, no)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                                   .replace(/\{\{LOC_TP_TYPE\}\}/, rowData.LOC_TP_TYPE)
                                   .replace(/\{\{TRANS_TYPE\}\}/, rowData.TRANS_TYPE)
                                   .replace(/\{\{BOX_NO\}\}/, rowData.BOX_NO)
                                   .replace(/\{\{MAKE_SEQ\}\}/, rowData.MAKE_SEQ)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/gi, rowData.PART_NM)
                                   .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                                   .replace(/\{\{BASIC_UNIT\}\}/, rowData.BASIC_UNIT)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{WH_CD\}\}/, rowData.WH_CD)
                                   .replace(/\{\{LOC_CD\}\}/, rowData.LOC_CD)
                                   .replace(/\{\{RACK_CD\}\}/, rowData.RACK_CD)
                                   .replace(/\{\{HOLD_FLAG\}\}/gi, rowData.HOLD_FLAG)
                                   .replace(/\{\{LOT_NO\}\}/gi, rowData.LOT_NO)
                                   .replace(/\{\{DKIND\}\}/gi, rowData.DKIND)
                                   .replace(/\{\{CONF_F\}\}/gi, rowData.CONF_F)
                                   .replace(/\{\{VENDOR_NM\}\}/gi, rowData.VENDOR_NM)
                                   .replace(/\{\{BOX_BAR_NO\}\}/gi, rowData.BOX_BAR_NO)
                                   .replace(/\{\{BOX_QTY\}\}/, "1");
                    $("#list_ot_070").prepend(tag);
                    no++;
                }
                Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "TO_PLANT_CD":"", "TO_LOC_TP":"", "SCAN_QTY":rowData.BAR_QTY, "BOX_NO":rowData.BOX_NO, "PART_CD":rowData.PART_CD, "VENDOR_CD":rowData.VENDOR_CD, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userToPlantCheck = $("#selTOPLANT").val();
        var userToLocTpCheck = $("#selTOLOCTP").val();

        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(userToPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000325']").text(), {showtime:"LONG"}); // 이동플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userToLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000326']").text(), {showtime:"LONG"}); // 이동저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        // 이동플랜트, 이동저장위치 Box_No_List 리스트에 set
        $.each(Box_No_List,function(key){
            Box_No_List[key]['TO_PLANT_CD'] = userToPlantCheck;
            Box_No_List[key]['TO_LOC_TP'] = userToLocTpCheck;
        });

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // 부품식별표 저장
    var save = function(){
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_070_C1.do',
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
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#inpBoxQty").text("0");
        no = 1;
        Box_No_List.length=0;

        $("#list_ot_070").html("");
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