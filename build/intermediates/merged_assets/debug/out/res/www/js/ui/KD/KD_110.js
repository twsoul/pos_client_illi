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

    var CaseArray = [];

    var Tot_Scan_Qty = 0;
    var Tot_Case_Qty = 0;

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 화면 초기화시 공장, 저장위치 콤보박스 조회
        PlantReq();
        LogiReq();
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

        // 플랜트 변경 시 스캔으로 포커스
        $("#selPLANT").on('change', function() {
            $("#inputScan").focus();
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selLOGI").on('change', function() {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        //BOX 클릭 시
        $("#inpBoxQtyLB").on('click', function() {
            if($("#txtDOC_NO").text() == ""){
                return;
            }
            if($("#inpBoxQty").hasClass("nRedbox1") == true){
                var content = "";
                CaseArray.find(object =>{
                    if(object.ScanChk == "N"){
                        content += "CASE : "+object.CASE+" / QTY : "+object.QTY+"\r\n";
                    }
                });
                content = content.slice(0,-2);
                popupManager.alert(content, {
                    title: $("[data-lng='MSG.0000000002']").text(),
                    buttons:[$("[data-lng='MSG.0000000002']").text()]
                });
            }
        })
        $("#inpBoxQty").on('click', function() {
            if($("#txtDOC_NO").text() == ""){
                return;
            }
            if($(this).hasClass("nRedbox1") == true){
                var content = "";
                CaseArray.find(object =>{
                    if(object.ScanChk == "N"){
                        content += "CASE : "+object.CASE+" / QTY : "+object.QTY+"\r\n";
                    }
                });
                content = content.slice(0,-2);
                popupManager.alert(content, {
                    title: $("[data-lng='MSG.0000000002']").text(),
                    buttons:[$("[data-lng='MSG.0000000002']").text()]
                });
            }
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
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
                }
            }
        });
    };

    // 플랜트 콤보박스 정보 조회
    var LogiReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtLogi.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selLOGI").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000632']").text(), {showtime:"LONG"}); // 사외창고 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selLOGI").append(tag);
                }
            }
        });
    };

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOGI").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000633']").text(), {showtime:"LONG"}); // 사외창고를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if($("#txtDOC_NO").text() == ""){
                DocNoScan(inputScan);
                return;
            }
            CaseNoScan(inputScan);
        }
    }

    // 스캔 시 부품식별표 조회
    var DocNoScan = function(inputScan) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_110_S1.do',
            data: {
                'LANG':getCORP_CD,
                'DOC_NO':inputScan,
                'event':'ANS입고 (세척장) 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000625']").text(), {showtime:"LONG"}); // 존재하지 않는 문서번호 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000626']").text(), {showtime:"LONG"}); // 플랜트가 일치하지 않는 문서번호입니다
                    $("#inputScan").focus();
                    return;
                }
                console.log("ATA_FLAG : "+rowData.ATA_FLAG);
                if(rowData.ATA_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000627']").text(), {showtime:"LONG"}); // 이미 납입된 문서번호입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#selPLANT").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);
                $("#list_kd_110_head").removeClass("blind");
                $("#txtVEND_CD").text(rowData.VENDOR_CD);
                $("#txtVEND_NM").text(rowData.VENDOR_NM);
                $("#txtDOC_NO").text(inputScan);

                var template = $("#ListTemplate").html();
                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var exist = false;
                    CaseArray.push({PART : rowData.PART_CD, CASE : rowData.CASE_NO, BAR : rowData.BAR_NO, QTY : rowData.CASE_QTY, ScanChk : "N" });
                    Tot_Case_Qty += parseInt(rowData.CASE_QTY);

                    $("#list_kd_110 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){
                            $(this).find(".CASE_QTY").text(parseInt($(this).find(".CASE_QTY").text()) + parseInt(rowData.CASE_QTY));
                            exist = true;
                        }
                   });
                   if(!exist){
                       tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                      .replace(/\{\{CASE_QTY\}\}/, rowData.CASE_QTY)
                                      .replace(/\{\{SCAN_QTY\}\}/, 0);
                       $("#list_kd_110").append(tag);
                   }
                });
            }
        });
    }

    // 스캔 시 Case no 비교
    var CaseNoScan = function(inputScan) {
        var find_chk = false;
        CaseArray.find(object =>{
            if(object.BAR === inputScan){
                if(object.ScanChk == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000629']").text(), {showtime:"LONG"}); // 이미 스캔한 CASE입니다
                    find_chk = true;
                    $("#inputScan").focus();
                    return false;
                }else{
                    find_chk = true;
                    object.ScanChk = "Y";

                    $("#list_kd_110 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == object.PART){
                            $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(object.QTY));

                            Tot_Scan_Qty += parseInt(object.QTY);
                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                            if(Tot_Scan_Qty == Tot_Case_Qty){ // 총 지시수량과 스캔수량이 같은경우
                                $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                            } else {
                                $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                            }
                            $(this).prependTo('div .list_kd_110:eq(1)');
                        }
                   });
                }
            }
        });

        if(!find_chk){
            popupManager.instance($("[data-lng='MSG.0000000628']").text(), {showtime:"LONG"}); // 문서에 해당 CASE NO가 존재 하지 않습니다
            $("#inputScan").focus();
            return;
        }
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if(Tot_Scan_Qty == 0){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty < Tot_Case_Qty){
            popupManager.instance($("[data-lng='MSG.0000000630']").text(), {showtime:"LONG"}); // 문서의 지시수량과 스캔수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        save();
    }

    // 저장 처리
    var save = function() {
        saveflag = true;
        var C1_LIST = [];

        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "DOC_NO":$("#txtDOC_NO").text(), "LOGI_CD":$("#selLOGI").val(), "USER_ID":getUSER_ID, "RTN_MSG":""});

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_110_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                saveflag = false;
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        CaseArray.length = 0;
        Tot_Scan_Qty = 0;
        Tot_Case_Qty = 0;

        $("#txtVEND_CD").text("");
        $("#txtVEND_NM").text("");
        $("#txtDOC_NO").text("");

        $("#list_kd_110").html("");
        $("#list_kd_110_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);
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