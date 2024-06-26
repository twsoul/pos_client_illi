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

    var scan_cnt = 0;
    var manual_flag = "N";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        // 체크해제 디폴트값
        $('#chk_Info').prop('checked', false);

        // 화면 초기화시 콤보박스 조회
        PlantReq();
        LogiReq();
        OtProcCdReq();
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
            clear();
            if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                PartCdReq();
            } else { // 기존포장 체크 해제시
                CaseNoScan();
            }
        })

        // 사외창고 변경 시 스캔으로 포커스
        $("#selLOGI").on('change', function() {
            clear();
            if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                PartCdReq();
            } else { // 기존포장 체크 해제시
                CaseNoScan();
            }
        })

        // 세척기 변경 시 스캔으로 포커스
        $("#selOT_PROC").on('change', function() {
            clear();
            if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                PartCdReq();
            } else { // 기존포장 체크 해제시
                CaseNoScan();
            }
        })

        // 품번 변경 시
        $("#selPART_CD").on('change', function() {
            if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                clear();
            }
        })

        // 기존포장 체크 박스 변경 시
        $("#chk_Info").on("change", function() {
            console.log("scan_cnt : "+scan_cnt);
            if(scan_cnt != 0){
                popupManager.alert($("[data-lng='MSG.0000000686']").text(), { // 작업완료를 먼저 하십시오
                title: $("[data-lng='MSG.0000000004']").text(), // 알림
                buttons:["OK"] // 확인
                }, function() {
                    if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                        $('#chk_Info').prop('checked', false);
                    } else { // 기존포장 체크 해제시
                        $('#chk_Info').prop('checked', true);
                    }
                    $("#inputScan").focus();
                    return;
                });
            } else {
                clear();
                if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                    PartCdReq();
                } else { // 기존포장 체크 해제시
                    CaseNoScan();
                }
            }
        });

        // 불량등록 버튼 클릭 시
        $("#btnBad").on("click", function() {
            popupManager.alert($("#txtBAD_QTY").val()+$("[data-lng='MSG.0000000749']").text(), { // 개를 불량 등록하시겠습니까?
            title: $("[data-lng='MSG.0000000004']").text(), // 알림
            buttons: ["OK", $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    BadRegistration();
                }
            });
        });

        // 작업완료 버튼 클릭 시
        $("#btnSave").on("click", function() {
            /*if(scan_cnt == 0){
                console.log("작업내역이 없습니다")
                popupManager.instance($("[data-lng='MSG.0000000688']").text(), {showtime:"LONG"}); // 작업내역이 없습니다
            }else{
                manual_flag = "Y";
                save();
            }*/
            manual_flag = "Y";
            save();
        });

        $("#footer_kd_130 > ul > li > .chk_btn").on("click", function(){
            console.log("scan_cnt : "+scan_cnt);
            if(scan_cnt != 0){
                popupManager.alert($("[data-lng='MSG.0000000686']").text(), { // 작업완료를 먼저 하십시오
                title: $("[data-lng='MSG.0000000004']").text(), // 알림
                buttons:["OK"] // 확인
                }, function() {
                    $("#inputScan").focus();
                    return;
                });
            } else {
                var page = $(this).data("value");
                if (page != ""){
                    if (page == "../common/allmenu.html"){
                         var url = window.location.href;
                         screenManager.moveToPage(page, { action: 'NO_HISTORY', animation: "SLIDE_TOP", param: {url: M.sec.encrypt(url).result} });
                     } else if (page == "../common/main.html") {
                         screenManager.replaceToPage(page);
                     } else {
                         screenManager.moveToPage(page, { animation: "SLIDE_TOP" });
                     }
                }
            }
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
                }
            }
        });
    };

    // 사외창고 콤보박스 정보 조회
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

    // 세척설비 콤보박스 정보 조회
    var OtProcCdReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtProcCd.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selOT_PROC").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000637']").text(), {showtime:"LONG"}); // 세척설비 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selOT_PROC").append(tag);
                    CaseNoScan();
                }
            }
        });
    };

    // 품번 콤보박스 정보 조회
    var PartCdReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_130_S2.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT").val(),
                'LOGI_CD': $("#selLOGI").val()
            },
            success: function(receivedData, setting) {
                $("#selPART_CD").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000647']").text(), {showtime:"LONG"}); // 품번 조회정보가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.PART_CD + "'>" + rowData.PART_CD + "</option>";
                    });
                    $("#selPART_CD").append(tag);
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
        if($("#selOT_PROC").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000638']").text(), {showtime:"LONG"}); // 세척설비를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                if(head_tail_chk(inputScan)){
                    if(scan_cnt!=0){
                        console.log("작업완료를 먼저 해주십시오");
                        //작업완료를 먼저 해주십시오
                        return;
                    }
                    BoxNoScan_Chk(inputScan);
                } else {
                    C1(inputScan);
                }
            } else { // 기존포장 체크 해제시
                C1(inputScan);
            }
        }
    }

    var head_tail_chk = function(box_no){
        var head,tail;
        console.log(box_no);
        head = box_no.substr(0,4);
        console.log(head);
        tail = box_no.substr(box_no.length-4,4);
        console.log(tail);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // 체크 해제 시 조회
    var CaseNoScan = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_130_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOGI_CD':$("#selLOGI").val(),
                'PROC_CD':$("#selOT_PROC").val(),
                'event':'ANS입고 (세척장) 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    console.log("조회정보가 없습니다");
                    popupManager.instance($("[data-lng='MSG.0000000652']").text(), {showtime:"LONG"}); // 조회정보가 없습니다
                    clear();
                    return;
                }
                if(rowData.BOX_NO == null){
                    console.log("세척투입된 케이스가 없습니다");
                    popupManager.instance($("[data-lng='MSG.0000000687']").text(), {showtime:"LONG"}); // 세척투입된 케이스가 없습니다
                    clear();
                    return;
                }
                $("#selPART_CD").html("");
                $("#selPART_CD").append("<option value='" + rowData.PART_CD + "'>" + rowData.PART_CD + "</option>");
                $("#selPART_CD").val(rowData.PART_CD);
                $("#selPART_CD").attr("disabled",true);

                $("#txtBOX_NO").val(rowData.BOX_NO);
                $("#txtCASE_NO").val(rowData.CASE_NO);
                $("#txtCASE_QTY").val(rowData.CASE_QTY);
                $("#txtBOX_QTY").val(rowData.BOX_QTY);
                $("#txtSCAN_QTY").val(0);
                $("#txtBAD_QTY").val(1);
            }
        });
    }

    // 체크 시 조회
    var BoxNoScan_Chk = function(boxno) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_130_S3.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'LOGI_CD':$("#selLOGI").val(),
                'PROC_CD':$("#selOT_PROC").val(),
                'PART_CD':$("#selPART_CD").val(),
                'BOX_BAR_NO':boxno,
                'event':'세척완료 기존포장 리스트 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    console.log("BOX NO이 존재하지 않습니다");
                    popupManager.instance($("[data-lng='MSG.0000000648']").text(), {showtime:"LONG"}); // BOX NO이 존재하지 않습니다
                    clear();
                    return;
                }
                if(rowData.PART_CD != $("#selPART_CD").val()){
                    console.log("품번이 다릅니다");
                    popupManager.instance($("[data-lng='MSG.0000000371']").text(), {showtime:"LONG"}); // 품번이 다릅니다
                    clear();
                    return;
                }
                /*if(rowData.PACK_DESC != $("#selOT_PROC").val()){
                    console.log("세척기 정보가 다릅니다");
                    popupManager.instance($("[data-lng='MSG.0000000692']").text(), {showtime:"LONG"}); // 세척기 정보가 다릅니다
                    clear();
                    return;
                }*/
                if(rowData.DONE_FLAG == "Y"){
                    console.log("작업 완료된 박스입니다");
                    popupManager.instance($("[data-lng='MSG.0000000689']").text(), {showtime:"LONG"}); // 작업 완료된 박스입니다
                    return;
                }

                if(rowData.CASE_NO == null){
                    console.log("세척투입된 케이스가 없습니다");
                    popupManager.instance($("[data-lng='MSG.0000000687']").text(), {showtime:"LONG"}); // 세척투입된 케이스가 없습니다
                    clear();
                    return;
                }
                $("#txtBOX_NO").val(rowData.BOX_NO);
                $("#txtCASE_NO").val(rowData.CASE_NO);
                $("#txtCASE_QTY").val(rowData.CASE_QTY);
                $("#txtBOX_QTY").val(rowData.BOX_QTY);
                $("#txtSCAN_QTY").val(rowData.WORK_QTY);
                $("#txtBAD_QTY").val(1);
            }
        });
    }

    var C1 = function(serial_no){
        var C1_LIST = [];
        var PART_CD = "";
        if($("#selPART_CD").val() != null){
            PART_CD = $("#selPART_CD").val();
        }
        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PROC_CD":$("#selOT_PROC").val(), "LOGI_CD":$("#selLOGI").val(), "SERIAL_NO":serial_no, "BOX_NO":$("#txtBOX_NO").val(), "PART_CD":PART_CD, "USER_ID":getUSER_ID, "RTN_MSG":"", "RTN_CASE":"", "RTN_PART":"", "RTN_BOX":"", "RTN_CQTY":"", "RTN_QTY":"", "RTN_DONE":""});

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_130_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result != "S"){
                    $("#screenNG").show();
                    $('#inputScan').attr('readonly', true);
                    setTimeout(function() {
                      $("#screenNG").hide();
                      $('#inputScan').attr('readonly', false);
                    }, 1500);
                    popupManager.instance(receivedData.result, {showtime:"LONG"});
                    return;
                }
                $("#screenOK").show();
                $('#inputScan').attr('readonly', true);
                setTimeout(function() {
                  $("#screenOK").hide();
                  $('#inputScan').attr('readonly', false);
                }, 1500);
                scan_cnt ++;
                $("#selPLANT").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);
                $("#selOT_PROC").attr("disabled",true);
                $("#selPART_CD").attr("disabled",true);

                if(receivedData.resultDone != "") {
                    $("#txtSCAN_QTY").val(0);
                    console.log("포장이 완료되었습니다");
                    popupManager.instance($("#txtBOX_NO").val() + $("[data-lng='MSG.0000000653']").text(), {showtime:"LONG"}); // 포장이 완료되었습니다
                    console.log("resultBox : "+receivedData.resultBox);
                    BoxInfo(receivedData.resultDone);
                } else {
                    $("#txtSCAN_QTY").val(parseInt($("#txtSCAN_QTY").val())+1);
                }

                if($("#selPART_CD").val() != receivedData.resultPart && receivedData.resultPart != undefined && receivedData.resultPart != null) {
                    $("#selPART_CD").html("");
                    $("#selPART_CD").append("<option value='" + receivedData.resultPart + "'>" + receivedData.resultPart + "</option>");
                    $("#selPART_CD").val(receivedData.resultPart);
                    $("#selPART_CD").attr("disabled",true);

                    /*if($("#txtBOX_NO").val() == receivedData.resultBox){
                        console.log("품번이 변경되어 작업 완료되었습니다");
                        popupManager.instance($("#selPART_CD").val()+" -> "+receivedData.resultPart+" "+$("[data-lng='MSG.0000000691']").text(), {showtime:"LONG"}); // 품번이 변경되어 작업 완료되었습니다
                        save();
                    }*/
                    console.log("품번이 변경되었습니다");
                    popupManager.instance($("#selPART_CD").val()+" -> "+receivedData.resultPart+" "+ $("[data-lng='MSG.0000000690']").text(), {showtime:"LONG"}); // 품번이 변경되었습니다
                }

                $("#txtBOX_NO").val(receivedData.resultBox);
                $("#txtCASE_NO").val(receivedData.resultCase);
                $("#txtCASE_QTY").val(receivedData.resultCQty);
                $("#txtBOX_QTY").val(receivedData.resultQty);
                if(receivedData.resultCase == ""){
                    popupManager.instance($("#selPART_CD").val()+" "+$("[data-lng='MSG.0000000687']").text(), {showtime:"LONG"}); // 세척투입된 케이스가 없습니다
                }
            },
            error: function(errorCode, errorMessage, settings) {
                $("#screenNG").show();
                $('#inputScan').attr('readonly', true);
                setTimeout(function() {
                  $("#screenNG").hide();
                  $('#inputScan').attr('readonly', false);
                }, 1500);
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                return;
            }
        });
    }

    var BoxInfo = function(boxno){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_130_S4.do',
            data: {
                'PLANT_CD':$("#selPLANT").val(),
                'BOX_NO':boxno,
                'LANG':getLNG,
                'event':'출력 대상 박스 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    console.log("BOX NO이 존재하지 않습니다");
                    popupManager.instance($("[data-lng='MSG.0000000648']").text(), {showtime:"LONG"}); // BOX NO이 존재하지 않습니다
                    return;
                }

                scan_cnt = 0;
                $("#selPLANT").attr("disabled",false);
                $("#selLOGI").attr("disabled",false);
                $("#selOT_PROC").attr("disabled",false);

                if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
                    $("#selPART_CD").attr("disabled",false);
                }

                console.log("Print start");
                console.log("scan_cnt : "+scan_cnt);

                console.log("PLANT_NM : "+rowData.PLANT_NM);
                console.log("PRINT_DT : "+rowData.PRINT_DT);
                console.log("BOX_NO : "+rowData.BOX_NO);
                console.log("PART_CD : "+rowData.PART_CD);
                console.log("PART_NM : "+rowData.PART_NM);
                console.log("LOT_NO : "+rowData.LOT_NO);
                console.log("EO_NO : "+rowData.EO_NO);
                console.log("BAR_QTY : "+rowData.BAR_QTY);
                console.log("DELI_DT : "+rowData.DELI_DT);
                console.log("VENDOR_CD : "+rowData.VENDOR_CD);
                console.log("INSP_FLAG : "+rowData.INSP_FLAG);
                console.log("VENDOR_NM : "+rowData.VENDOR_NM);
                console.log("BIN_NO : "+rowData.BIN_NO);
                console.log("PART_KG : "+rowData.PART_KG);
                console.log("BOX_KG : "+rowData.BOX_KG);
                console.log("PRINT_MEMO : "+rowData.PRINT_MEMO);
                console.log("BOX_BAR_NO : "+rowData.BOX_BAR_NO);

                // 라벨 프린트 호출
                exWNPrintLabel(rowData.PLANT_NM,
                               rowData.PRINT_DT == undefined ? "" : rowData.PRINT_DT,
                               rowData.BOX_NO,
                               rowData.PART_CD,
                               rowData.PART_NM == undefined ? "" : rowData.PART_NM,
                               rowData.LOT_NO == undefined ? "" : rowData.LOT_NO,
                               rowData.EO_NO == undefined ? "" : rowData.EO_NO,
                               String(rowData.BAR_QTY),
                               "",
                               rowData.DELI_DT == undefined ? "" : rowData.DELI_DT,
                               rowData.VENDOR_CD,
                               rowData.INSP_FLAG,
                               rowData.VENDOR_NM == undefined ? "" : rowData.VENDOR_NM,
                               rowData.BIN_NO == undefined ? "" : rowData.BIN_NO,
                               String(rowData.PART_KG == undefined ? 0 : rowData.PART_KG),
                               String(rowData.BOX_KG == undefined ? 0 : rowData.BOX_KG),
                               rowData.PRINT_MEMO == undefined ? "" : rowData.PRINT_MEMO,
                               rowData.BOX_BAR_NO);
            }
        });
    }

    // 불량 등록
    var BadRegistration = function(){
        var C2_LIST = [];
        var PART_CD = "";
        if($("#selPART_CD").val() != null){
            PART_CD = $("#selPART_CD").val();
        }
        C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PROC_CD":$("#selOT_PROC").val(), "LOGI_CD":$("#selLOGI").val(), "BOX_NO":$("#txtBOX_NO").val(), "BAD_QTY":$("#txtBAD_QTY").val(), "PART_CD":PART_CD, "USER_ID":getUSER_ID,"RTN_MSG":"", "RTN_CASE":"", "RTN_PART":"", "RTN_BOX":"", "RTN_CQTY":"", "RTN_QTY":""});

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_130_C2.do',
            data: {
                'param1': C2_LIST
            },
            success: function(receivedData, setting) {
                console.log("불량등록 되었습니다");
                popupManager.instance($("[data-lng='MSG.0000000651']").text(), {showtime:"LONG"}); // 불량등록 되었습니다

                $("#selPART_CD").html("");
                $("#selPART_CD").append("<option value='" + receivedData.resultPart + "'>" + receivedData.resultPart + "</option>");
                $("#selPART_CD").val(receivedData.resultPart);
                $("#selPART_CD").attr("disabled",true);

                $("#txtBOX_NO").val(receivedData.resultBox);
                $("#txtCASE_NO").val(receivedData.resultCase);
                $("#txtCASE_QTY").val(receivedData.resultCQty);
                $("#txtBOX_QTY").val(receivedData.resultQty);

                $("#txtBAD_QTY").val(1);
                if(receivedData.resultCase == ""){
                    console.log("세척투입된 케이스가 없습니다");
                    popupManager.instance($("#txtBOX_NO").val() + $("[data-lng='MSG.0000000687']").text(), {showtime:"LONG"}); // 세척투입된 케이스가 없습니다
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000650']").text(), {showtime:"LONG"}); // 불량등록에 실패하였습니다
                return;
            }
        });
    }

    // 작업 완료
    var save = function() {
        var C3_LIST = [];
        var PART_CD = "";
        if($("#selPART_CD").val() != null){
            PART_CD = $("#selPART_CD").val();
        }
        var chk = "";
        if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
            chk = "Y";
        } else { // 기존포장 체크 해제시
            chk = "N";
        }
        C3_LIST.push({"MANUAL":manual_flag, "CHK_YN":chk, "COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PROC_CD":$("#selOT_PROC").val(), "LOGI_CD":$("#selLOGI").val(), "BOX_NO":$("#txtBOX_NO").val(), "PART_CD":PART_CD, "SCAN_QTY":scan_cnt, "USER_ID":getUSER_ID, "RTN_MSG":"", "RTN_CASE":"", "RTN_PART":"", "RTN_BOX":"", "RTN_CQTY":"", "RTN_QTY":""});

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_130_C3.do',
            data: {
                'param1': C3_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result != "S"){
                    popupManager.instance(receivedData.result, {showtime:"LONG"});
                    return;
                }
                manual_flag = "N";

                console.log("박스 작업이 완료되었습니다");
                popupManager.instance($("#txtBOX_NO").val()+$("[data-lng='MSG.0000000654']").text(), {showtime:"LONG"}); // 박스 작업이 완료되었습니다

                $("#selPLANT").attr("disabled",false);
                $("#selLOGI").attr("disabled",false);
                $("#selOT_PROC").attr("disabled",false);
                if(scan_cnt>0){
                    BoxInfo($("#txtBOX_NO").val());
                }
                scan_cnt = 0;
                if(chk == "Y"){
                    clear();
                    PartCdReq();
                    return;
                }

                $("#selPART_CD").html("");
                $("#selPART_CD").append("<option value='" + receivedData.resultPart + "'>" + receivedData.resultPart + "</option>");
                $("#selPART_CD").val(receivedData.resultPart);
                $("#selPART_CD").attr("disabled",true);

                $("#txtBOX_NO").val(receivedData.resultBox);
                $("#txtCASE_NO").val(receivedData.resultCase);
                $("#txtCASE_QTY").val(receivedData.resultCQty);
                $("#txtBOX_QTY").val(receivedData.resultQty);
                $("#txtSCAN_QTY").val(0);
                if(receivedData.resultCase == ""){
                    console.log("세척투입된 케이스가 없습니다");
                    popupManager.instance($("#txtBOX_NO").val() + $("[data-lng='MSG.0000000687']").text(), {showtime:"LONG"}); // 세척투입된 케이스가 없습니다
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                manual_flag = "N";
                return;
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        if ($("#chk_Info").prop("checked")) { // 기존포장 체크시
            $("#selPART_CD").attr("disabled",false);
        } else { // 기존포장 체크 해제시
            $("#selPART_CD").html("");
            $("#selPART_CD").attr("disabled",false);
        }

        $("#txtBOX_NO").val("");
        $("#txtCASE_NO").val("");
        $("#txtCASE_QTY").val("");
        $("#txtBOX_QTY").val("");
        $("#txtSCAN_QTY").val(0);
        $("#txtBAD_QTY").val(1);
        $("#inputScan").focus();

        scan_cnt = 0;
        $("#selPLANT").attr("disabled",false);
        $("#selLOGI").attr("disabled",false);
        $("#selOT_PROC").attr("disabled",false);
    }

    var inputEvent = function(obj) {
        if($(obj).val() == "" || $(obj).val() == 0){
            $(obj).val(1);
        }

        if($(obj).val()> parseInt($("#txtCASE_QTY").val())){
            $(obj).val(parseInt($("#txtCASE_QTY").val()));
        }
    };

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
	};

	var moveToBack = function() {
	    console.log("scan_cnt : "+scan_cnt);
	    if(scan_cnt != 0){
            popupManager.alert($("[data-lng='MSG.0000000686']").text(), { // 작업완료를 먼저 하십시오
            title: $("[data-lng='MSG.0000000004']").text(), // 알림
            buttons:["OK"] // 확인
            }, function() {
                $("#inputScan").focus();
                return;
            });
	    } else {
	        screenManager.moveToBack();
	    }
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