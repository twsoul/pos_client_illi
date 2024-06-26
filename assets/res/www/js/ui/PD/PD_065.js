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
    var C1_LIST = [];
    var C2_LIST = [];
    var C1_tag = "";
    var C1_min = "";
    var C1_max = "";
    var C1_cnt = "";
    var scan_Cnt = 0;

    var over_chk = false;
    var Tot_Scan_Qty = 0;

    var REPACK_FLAG = "";
    var PART_CD = "";
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
                    console.log("inputScan : "+ inputScan);
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("90");
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
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
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq("90");
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': [type]
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
            }
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        var box_no = "";

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
            if($("#txtPALLETNO").text() == ""){
                PalletNoScan(inputScan);
            }else{
                box_no = boxBarProcessing(inputScan);
                console.log("box_no : "+box_no);
                BoxNoScan(box_no);
            }
        }
    }

    // 팔레트 조회 함수(경주SCM)
    var PalletNoScan = function(pallet_no) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectPlalletNoSCM.do',
            data: {
                'BOX_BAR_NO': pallet_no,
                'LANG':getLNG,
                'event':'팔레트 조회(경주SCM)'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var sLotNo = "";
                var eLotNo = "";
                var cnt = 0;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.CNT != 0) {
                    popupManager.instance($("[data-lng='MSG.0000000392']").text(), {showtime:"LONG"}); // 이미 맵핑된 팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 팔레트 정보 레포트
                $("#txtPALLETNO").text(rowData.BAR_NO);
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtPART_NM").text(rowData.PART_NM);
                $("#txtCNT").text(rowData.PACK_QTY);
                REPACK_FLAG = rowData.REPACK_FLAG;
                PART_CD = rowData.PART_CD;

                $("#inputScan").focus();
            }
        });
    };

    // 부품식별표(경주SCM) 조회 함수
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_065_S1.do',
            data: {
                'BOX_NO': box_barcode,
                'PART_CD': PART_CD,
                'event':'부품식별표(경주SCM) 조회'
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
                if(IsNotExitList(rowData.BOX_NO)){
                    popupManager.instance($("[data-lng='MSG.0000000361']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔한 부품식별표가 맵핑되지 않은 부품식별표인경우
                if(rowData.MAP_BAR_NO == null || rowData.MAP_BAR_NO == undefined || rowData.MAP_BAR_NO == "undefined"){
                    // BOX 수량 증가 및 전체 수량 증가
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                    var tag = "";
                    var template = $("#ListTemplate").html();

                    // 새로 스캔한 부품식별표 LOT 계산
                    if(rowData.MIN_SERIAL_NO < $("#txtSLOTNO").text() || $("#txtSLOTNO").text() == ""){
                        $("#txtSLOTNO").text(rowData.MIN_SERIAL_NO);
                    }
                    if(rowData.MAX_SERIAL_NO > $("#txtELOTNO").text() || $("#txtELOTNO").text() == ""){
                        $("#txtELOTNO").text(rowData.MAX_SERIAL_NO);
                    }

                    Tot_Scan_Qty += parseInt(rowData.CNT);
                    if(Tot_Scan_Qty == Number($("#txtCNT").text()) && over_chk == false){
                        $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                    } else if (Tot_Scan_Qty > Number($("#txtCNT").text())) {
                        over_chk = true;
                        $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                    }
                    console.log("Tot_Scan_Qty : "+Tot_Scan_Qty);
                    console.log("txtCNT : "+Number($("#txtCNT").text()));

                    $("#list_pd_065_head").removeClass("blind");
                    tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{MIN_SERIAL_NO\}\}/, rowData.MIN_SERIAL_NO)
                                   .replace(/\{\{MAX_SERIAL_NO\}\}/, rowData.MAX_SERIAL_NO)
                                   .replace(/\{\{CNT\}\}/gi, rowData.CNT)
                                   .replace(/\{\{MAP_BAR_NO\}\}/, rowData.MAP_BAR_NO);
                    $("#list_pd_065").prepend(tag);
                    scan_Cnt ++;
                } else {
                    popupManager.alert($("[data-lng='MSG.0000000363']").text(), { // 매핑 정보가 있습니다! 해포하고 진행하시겠습니까?
                    title: $("[data-lng='LB.0000000365']").text(),
                    buttons: ['예', '아니오']
                    }, function(index) {
                        if (index == 1){
                            return;
                        }else{
                            C1_tag = "";
                            var template = $("#ListTemplate").html();

                            Tot_Scan_Qty += parseInt(rowData.CNT);
                            if(Tot_Scan_Qty == Number($("#txtCNT").text()) && over_chk == false){
                                $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                            } else if (Tot_Scan_Qty > Number($("#txtCNT").text())) {
                                over_chk = true;
                                $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                            }
                            console.log("Tot_Scan_Qty : "+Tot_Scan_Qty);
                            console.log("txtCNT : "+Number($("#txtCNT").text()));

                            $("#list_pd_065_head").removeClass("blind");
                            C1_tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                           .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                           .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                           .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                           .replace(/\{\{MIN_SERIAL_NO\}\}/, rowData.MIN_SERIAL_NO)
                                           .replace(/\{\{MAX_SERIAL_NO\}\}/, rowData.MAX_SERIAL_NO)
                                           .replace(/\{\{CNT\}\}/gi, rowData.CNT)
                                           .replace(/\{\{MAP_BAR_NO\}\}/, rowData.MAP_BAR_NO);

                            C1_min = rowData.MIN_SERIAL_NO;
                            C1_max = rowData.MAX_SERIAL_NO;
                            C1_cnt = rowData.CNT;

                            C1_LIST.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "MAP_BAR_NO":rowData.MAP_BAR_NO, "LOC_TP":$("#selLOCTP").val(), "USER_ID":getUSER_ID, "RTN_MSG":"" });
                            MapBarNo();
                        }
                    })
                }
                $("#inputScan").focus();
            }
        });
    };

    // 바코드 Box_No 추출 함수
    var boxBarProcessing = function(box_bar_no){ // 바코드 예시 - [)>06VPF30P88332MU321ASET211201MC3510046@48EAMC
        var myResult = /T.{2,}/g.exec(box_bar_no);
        console.log(box_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(2,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf("@")));
            return box_no.substr(0,box_no.indexOf("@"));
        }else{
            return "";
        }
    }

    // 매핑정보가 존재하는 경우 해포하는 함수
    var MapBarNo = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_065_C1.do',
            data: {
                'param1': C1_LIST,
                'event':'해포'
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000364']").text(), {showtime:"LONG"}); // 해포 되었습니다
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                    $("#list_pd_065").prepend(C1_tag);

                    if(C1_min < $("#txtSLOTNO").text() || $("#txtSLOTNO").text() == ""){
                        $("#txtSLOTNO").text(C1_min);
                    }
                    if(C1_max > $("#txtELOTNO").text() || $("#txtELOTNO").text() == ""){
                        $("#txtELOTNO").text(C1_max);
                    }

                    C1_min = "";
                    C1_max = "";
                    scan_Cnt++;
                    C1_LIST.length = 0;
                }else{
                    C1_min = "";
                    C1_max = "";
                    C1_LIST.length = 0;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
                C1_min = "";
                C1_max = "";
                C1_LIST.length = 0;
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_Chk = true;
        if(scan_Cnt == 0){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty != Number($("#txtCNT").text())){
            popupManager.instance($("[data-lng='MSG.0000000393']").text(), {showtime:"LONG"}); // 스캔수량과 팔레트 수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if((Tot_Scan_Qty == Number($("#txtCNT").text())) && (over_chk == true)) {
            popupManager.instance($("[data-lng='MSG.0000000393']").text(), {showtime:"LONG"}); // 스캔수량과 팔레트 수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty == Number($("#txtCNT").text()) && over_chk == false) {
            $("#list_pd_065 .tableCont").each(function() {
                C2_LIST.push({"REPACK_FLAG":REPACK_FLAG, "COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$("#selPLANT").val(), "BAR_NO":$("#txtPALLETNO").text(), "LOC_TP":$("#selLOCTP").val(), "BOX_NO":$(this).data("boxno"), "USER_ID":getUSER_ID, "RTN_MSG":"" })
            });
            $.each(C2_LIST,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                $.each(value,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                });
            });
            save();
        }
    }

    // 팔레트 매핑 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_065_C2.do',
            data: {
                'param1': C2_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                saveflag = false;
                C2_LIST.length = 0;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_pd_065").html("");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        $("#list_pd_065_head").addClass("blind");

        Box_No_Arr.length = 0;
        C1_LIST.length = 0;
        C2_LIST.length = 0;
        C1_tag = "";
        C1_min = "";
        C1_max = "";
        C1_cnt = "";
        scan_Cnt = 0;
        REPACK_FLAG = "";
        PART_CD = "";

        Tot_Scan_Qty = 0;
        over_chk = false;

        $("#txtPALLETNO").text("");
        $("#txtPART_CD").text("");
        $("#txtCNT").text("0");
        $("#txtPART_NM").text("");
        $("#txtSLOTNO").text("");
        $("#txtELOTNO").text("");

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_NO이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;
        $("#list_pd_065 .tableCont").each(function() {
            if($(this).data("boxno") == box_no){
                rtn = true;
                return false; // each 문의 break;
            }
        });
        return rtn;
    };

    var inputEvent = function(obj) {
        console.log("value : "+ $(obj).val() );
        $(obj).val()

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }
    };

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
		setReloadEvent: setReloadEvent,
		inputEvent: inputEvent
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