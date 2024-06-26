/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    // 부품식별표 바코드 Processing
    var lp_box_no = "";
    var lp_part_no = "";
    var lp_box_qty = "";
    var lp_box_lot_no = "";
    var lp_box_BoxSeq = "";
    var lp_box_Prt = "";
    var lp_box_vendcd = "";

    // 저장 리스트 목록
    var C1_LIST = [];
    var C2_LIST = [];
    var C3_LIST = [];
    var C4_LIST = [];
    var Box_No_Arr = [];

    // 총 지시수량 및 스캔수량 초기화
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;               // 과납 여부 체크 플래그
    var barcode_chk = true;             // 정상 바코드 체크 플래그

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        // 화면 초기화시 공장, 저장위치 콤보박스 조회
        PlantReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();

                console.log("inputScan : "+inputScan);
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
        })

        // 저장위치 변경 시 스캔으로 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
        })
    };

    // 내부 DB 입고 스캔 CREATE 함수
    var createTABLE = function() {
        var query = 'CREATE TABLE IF NOT EXISTS INBOX (DELINO TEXT NOT NULL, BOXBAR TEXT NOT NULL, PRIMARY KEY(DELINO, BOXBAR))';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                	title: $("[data-lng='MSG.0000000004']").text(),
                	buttons:[$("[data-lng='MSG.0000000002']").text()]
                }, function() {
                	M.sys.exit();
                });
            }
        });
    };

    // 내부 DB 입고 스캔 SELECT 함수
    var selectTABLE = function(data) {
        var DBlist = [];
        $.each(data.row_list, function(index,rowData){
            DBlist.push(rowData.BOXBAR);
        });
        PartNoScanTemp(DBlist);
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
                        tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.CNTR_BAR_FLAG + "' value2='" + rowData.INSP_FIND_YN +"'>" + rowData.TEXT + "</option>";
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
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                if($("#selPLANT option:selected").val() == getWERKS){
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
            }
        });
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        var deli_no = "";

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
            if($("#txtORDR_NO").text() == "") { // 납입카드 스캔 내역이 없을 때
                if(!head_tail_chk(inputScan)){ // 바코드 형식이 아닐경우
                    deli_no = inputScan;
                }else{ // 바코드 형식일 경우
                    deli_no = deliNoProcessing(inputScan);
                }
                Deli_No_Sel(deli_no,inputScan);
            } else { // 납입카드 스캔 내역이 있는 경우 부품식별표 스캔
                PartNoScan(inputScan);
            }
        }
    }

    // 바코드 DELI_NO 추출 함수
    var deliNoProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:DN.{2,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("잘못된 DELI_NO 바코드");
            barcode_chk = false;
            return "";
        }
    }

    // 바코드 WORK_SEQ 추출 함수
    var workSeqProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:6E.{3,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("WORK_SEQ가 존재하지 않음");
            barcode_chk = false;
            return "";
        }
    }

    // 바코드 VENDOR_CD 추출 함수
    var vendorCdProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:V.{2,}/g.exec(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(2,myResult[0].length-1);
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("VENDOR_CD 존재하지 않음");
            barcode_chk = false;
            return "";
        }
    }

    var head_tail_chk = function(deli_bar_no){
        var head,tail;
        head = deli_bar_no.substr(0,4);
        tail = deli_bar_no.substr(deli_bar_no.length-4,4);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    var chgBar = function(bar_no){
        var bar = bar_no.replace(/\[/g,"^&")
                        .replace(/\]/g,"&^")
                        .replace(/\,/g,"^*")
                        .replace(/\=/g,"^%");
        return bar;
    }

    // 납입 카드 정보 조회 함수
    var Deli_No_Sel = function(deli_bar_no,deli_barcode_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectDeliNoO.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'DELI_BAR_NO':deli_bar_no,
                'PLANT_CD':$("#selPLANT").val(),
                'LANG':getLNG,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_ST == "99"){
                    popupManager.instance($("[data-lng='MSG.0000000508']").text(), {showtime:"LONG"}); // 발행 취소된 납입카드 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.IN_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000273']").text(), {showtime:"LONG"}); // 이미 납입된 납입카드 번호입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_CASE == undefined){
                    popupManager.instance($("[data-lng='MSG.0000000495']").text(), {showtime:"LONG"}); // 납품유형이 누락되었습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOUSING_FLAG != "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000694']").text(), {showtime:"LONG"}); // 납입카드입고 메뉴를 사용해 주십시오
                    $("#inputScan").focus();
                    return;
                }
                var COLOR = "";
                var tag = "";
                var insp = true;
                var template = $("#ListTemplate").html();
                $.each(receivedData.ListData, function(index,rowData){
                    if(rowData.OVER_QTY <= 0){
                        COLOR = "nBluebox1";
                    } else {
                        COLOR = "nRedbox1";
                    }

                    tag += template.replace(/\{\{PART_NO\}\}/, rowData.PART_CD)
                                   .replace(/\{\{OVER_QTY\}\}/, rowData.OVER_QTY == undefined ? 0 : rowData.OVER_QTY)
                                   .replace(/\{\{COLOR\}\}/, COLOR)
                                   .replace(/\{\{ORD_QTY\}\}/, rowData.DELI_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                   .replace(/\{\{vPartNo\}\}/, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{BOX_QTY\}\}/, rowData.BOX_QTY)
                                   .replace(/\{\{DELI_QTY\}\}/, rowData.DELI_QTY)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{INSP_FLAG\}\}/, rowData.INSP_FLAG)
                                   .replace(/\{\{DELI_TYPE\}\}/, rowData.DELI_TYPE)
                                   .replace(/\{\{SCAN_BOX_CNT\}\}/, "0")
                                   .replace(/\{\{VEND_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VEND_NM\}\}/, rowData.VENDOR_NM);
                    Tot_Deli_Qty += parseInt(rowData.DELI_QTY);
                    if(rowData.INSP_FLAG == undefined){
                        insp = false;
                    }
                });

                if(!insp){
                    popupManager.instance($("[data-lng='MSG.0000000458']").text(), {showtime:"LONG"}); // 검사유무 기준정보가 누락되었습니다
                    $("#inputScan").focus();
                    return;
                }

                $("#selLOCTP").attr("disabled",true);
                $("#selPLANT").attr("disabled",true);
                $("#list_in_080_head").removeClass("blind");
                deli_CASE = rowData.DELI_CASE;
                $("#list_in_080").append(tag);
                $("#txtVEND_CD").text(rowData.VENDOR_CD);
                $("#txtVEND_NM").text(rowData.VENDOR_NM);
                $("#txtORDR_NO").text(rowData.DELI_NO);
                popupManager.instance($("[data-lng='MSG.0000000499']").text() + rowData.DELI_CASE_NM, {showtime:"LONG"}); // 납품유형 :

                if($("#txtORDR_NO").text() != ""){
                    var query = 'SELECT BOXBAR FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'"';
                    M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        if(status == "FAIL") {
                            createTABLE();
                        } else {
                            if(result.row_count > 0){
                                selectTABLE(result);
                            }
                        }
                    });
                }
                $("#inputScan").focus();
            }
        });
    };

    // 임시데이터 조회
   var PartNoScanTemp = function(DBlist) {
       networkManager.httpSend({
           server: saveUserCo,
           path: 'api/selectBoxNoInTemp.do',
           data: {
               'COPORATE_CD':getCORP_CD,
               'BOX_BAR_NO':DBlist,
               'event':'정보 수신 및 전송'
           },
           success: function(receivedData, setting) {
               $.each(receivedData.ListData, function(index,rowData){
                   if(DBlist.indexOf(rowData.BOX_BAR_NO) != -1){
                       DBlist.splice(DBlist.indexOf(rowData.BOX_BAR_NO),1);
                   }
                   if(rowData.BOX_YN == "Y"){
                       var query = 'DELETE FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                       M.db.execute(getUSER_ID, query, function(status, result,  name) {
                       });
                   }else{
                       var insp_flag = "";
                       $("#list_in_080 .tableCont").each(function() {
                           if($(this).data("vpartno") == rowData.PART_CD){
                               $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                               $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);

                               // 한 로우에 스캔 수량이 지시수량을 초과하는 경우
                               if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                                   over_chk = true; // 과납 플래그 true 처리
                                   $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                               }

                               // 한 로우에 스캔 수량이 지시수량과 일치하는 경우
                               if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                                   $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                               }

                               Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                               $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                               if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 총 지시수량과 스캔수량이 같은경우
                                   $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                               } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 총 스캔수량이 지시 수량을 넘는 경우
                                   over_chk = true; // 과납 플래그 true 처리
                                   $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                               }
                               insp_flag = $(this).data("inspflag");
                               $(this).prependTo('div .list_in_080:eq(1)');
                           }
                       });
                       Box_No_Arr.push(rowData.BOX_NO);
                       C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":rowData.BOX_BAR_NO, "LOT_NO":rowData.LOT_NO == undefined ? "":rowData.LOT_NO, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                   }
               });
               if(DBlist.length > 0){
                   for(var i = 0; i < DBlist.length; i++ ) {
                       barcodeProcessingTemp(DBlist[i]);
                       if(i == DBlist.length-1)$("#inputScan").focus();
                   }
               }else{
                   $("#inputScan").focus();
               }
           }
       });
   }

   // 임시데이터 바코드 가공 처리
   var barcodeProcessingTemp = function(barcode){
       var qrCode = new qrManager.QRcode(barcode);
       qrcode_callback(qrCode);
       var insp_flag = "";
       var coperate_cd = "";
       $("#list_in_080 .tableCont").each(function() {
           if($(this).data("vpartno") == lp_part_no){
               $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(lp_box_qty));
               $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
               if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                   over_chk = true;
                   $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
               }
               if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                   $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
               }
               Tot_Scan_Qty += parseInt(lp_box_qty);
               $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
               if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                   $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
               } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                   over_chk = true;
                   $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
               }
               insp_flag = $(this).data("inspflag");
               coperate_cd = $(this).data("coperatecd");
               $(this).prependTo('div .list_in_080:eq(1)');
           }
       });
       Box_No_Arr.push(lp_box_no);
       C2_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":barcode, "LOT_NO":lp_box_lot_no, "BOX_NO":lp_box_no, "VENDOR_CD":lp_box_vendcd, "PART_CD":lp_part_no, "INV_QTY":Number(lp_box_qty), "INSP_FLAG":insp_flag, "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
   }

    // 스캔 시 부품식별표별 품번 조회
    var PartNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNoIn.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'BOX_BAR_NO':boxBarCode,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    console.log("value1 : "+$("#selPLANT option:selected").attr('value1'));
                    if($("#selPLANT option:selected").attr('value1') == "Y"){
                        barcodeProcessing(boxBarCode);
                    } else {
                        popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                        $("#inputScan").focus();
                    }
                    return;

                }
                if(rowData.VENDOR_CD != $("#txtVEND_CD").text()){
                    popupManager.instance($("#txtVEND_CD").text()+ " / "+ rowData.VENDOR_CD + $("[data-lng='MSG.0000000132']").text(), {showtime:"LONG"}); // 납입카드와 부품식별표의 업체코드가 일치하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BOX_YN == "Y"){
                    popupManager.instance(rowData.BOX_NO +" "+$("[data-lng='MSG.0000000284']").text(), {showtime:"LONG"}); // 는 이미 입고된 Box입니다
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

                $("#list_in_080 .tableCont").each(function() {
                    if($(this).data("vpartno") == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);

                        // 한 로우에 스캔 수량이 지시수량을 초과하는 경우
                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                            over_chk = true; // 과납 플래그 true 처리
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }

                        // 한 로우에 스캔 수량이 지시수량과 일치하는 경우
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }

                        Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 총 지시수량과 스캔수량이 같은경우
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 총 스캔수량이 지시 수량을 넘는 경우
                            over_chk = true; // 과납 플래그 true 처리
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                        insp_flag = $(this).data("inspflag");
                        $(this).prependTo('div .list_in_080:eq(1)');
                    }
                });
                if(!exists){
                    Box_No_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입지시내역에 존재하지 않는 PART NO입니다
                    $("#inputScan").focus();
                    return;
                }else{
                    var query = 'INSERT OR REPLACE INTO INBOX (DELINO, BOXBAR) values ("'+$("#txtORDR_NO").text()+'","'+rowData.BOX_BAR_NO+'")';
                    M.db.execute(getUSER_ID, query, function(status, result, name) {
                        if(status == "FAIL") {
                            popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                            	title: $("[data-lng='MSG.0000000004']").text(),
                            	buttons:[$("[data-lng='MSG.0000000002']").text()]
                            }, function() {
                            	M.sys.exit();
                            });
                        }
                    });
                    C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":rowData.BOX_BAR_NO, "LOT_NO":rowData.LOT_NO == undefined ? "":rowData.LOT_NO, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "INSP_FLAG":insp_flag, "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    // 바코드 가공 처리
    var barcodeProcessing = function(barcode){
        var qrCode = new qrManager.QRcode(barcode);
        var exists = false;
        var bar_exists = false;

        if(!qrManager.isValidBarcode(qrCode)){
            console.log("fail");
            return;
        }
        qrcode_callback(qrCode);

        if(lp_box_vendcd != $("#txtVEND_CD").text()){
            popupManager.instance($("#txtVEND_CD").text()+ " / "+ lp_box_vendcd + $("[data-lng='MSG.0000000132']").text(), {showtime:"LONG"}); // 납입카드와 부품식별표의 업체코드가 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }

        var insp_flag = "";
        Box_No_Arr.forEach(function(arr){
            if(lp_box_no == arr){
                bar_exists = true;
            }
        });
        if(!bar_exists){
            Box_No_Arr.push(lp_box_no);
        } else {
            popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
            $("#inputScan").focus();
            return;
        }

        $("#list_in_080 .tableCont").each(function() {
            if($(this).data("vpartno") == lp_part_no){
                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(lp_box_qty));
                $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".ORD_QTY").text())){
                    over_chk = true;
                    $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                }
                if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".ORD_QTY").text())){
                    $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                }
                Tot_Scan_Qty += parseInt(lp_box_qty);
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                    over_chk = true;
                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                }
                exists = true;
                insp_flag = $(this).data("inspflag");
                $(this).prependTo('div .list_in_080:eq(1)');
            }
        });
        if(!exists){
            Box_No_Arr.pop();
            popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입지시내역에 존재하지 않는 PART NO입니다
            $("#inputScan").focus();
            return;
        }else{
            var query = 'INSERT OR REPLACE INTO INBOX (DELINO, BOXBAR) values ("'+$("#txtORDR_NO").text()+'","'+barcode+'")';
            M.db.execute(getUSER_ID, query, function(status, result, name) {
                if(status == "FAIL") {
                    popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                    	title: $("[data-lng='MSG.0000000004']").text(),
                    	buttons:[$("[data-lng='MSG.0000000002']").text()]
                    }, function() {
                    	M.sys.exit();
                    });
                }
            });
            C2_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_BAR_NO":barcode, "LOT_NO":lp_box_lot_no, "BOX_NO":lp_box_no, "VENDOR_CD":lp_box_vendcd, "PART_CD":lp_part_no, "INV_QTY":Number(lp_box_qty), "INSP_FLAG":insp_flag, "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
        }
        $("#inputScan").focus();
    }

    // 저장 조건 처리
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        if(Tot_Scan_Qty != Tot_Deli_Qty || (Tot_Scan_Qty == Tot_Deli_Qty && over_chk == true)){
            popupManager.instance($("[data-lng='MSG.0000000276']").text(), {showtime:"LONG"}); // 납입카드 지시수량과 스캔수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }else{
            save();
        }

    }

    // 저장 처리
    var save = function() {
        saveflag = true;
        $("#list_in_080 .tableCont").each(function() {
            var PART_NM = $(this).data("partnm").replace(/\[/g,"^&")
                                                .replace(/\]/g,"&^")
                                                .replace(/\,/g,"^*")
                                                .replace(/\=/g,"^%");
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text() , "PART_CD":$(this).find(".PART_NO").text(), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "WORK_ID":getUSER_ID, "RTN_MSG":""});
        });


        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        $.each(C2_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_IN_080_C1.do',
            data: {
                'param1': C1_LIST,
                'param2': C2_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    C1_LIST.length = 0;
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                C1_LIST.length = 0;
                saveflag = false;
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        console.log("clear");
        var query = 'DELETE FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'"';
        M.db.execute(getUSER_ID, query, function(status, result, name) {
            if(status == "FAIL") {
                popupManager.alert($("[data-lng='MSG.0000000196']").text(), {
                	title: $("[data-lng='MSG.0000000004']").text(),
                	buttons:[$("[data-lng='MSG.0000000002']").text()]
                }, function() {
                	M.sys.exit();
                });
            }
        });
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        over_chk = false;
        barcode_chk = true;
        deli_CASE = "";
        plant_cd = "";

        lp_box_no = "";
        lp_part_no = "";
        lp_box_qty = "";
        lp_box_lot_no = "";
        lp_box_BoxSeq = "";
        lp_box_Prt = "";
        lp_box_vendcd = "";

        C1_LIST.length = 0;
        C2_LIST.length = 0;
        C3_LIST.length = 0;
        C4_LIST.length = 0;

        Box_No_Arr.length = 0;

        $("#list_in_080").html("");
        $("#txtORDR_NO").text("");
        $("#txtVEND_CD").text("");
        $("#txtVEND_NM").text("");
        $("#list_in_080_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        saveflag = false;
        $("#inputScan").focus();
    }

    // 가공 처리한 부품식별표 데이터
    var qrcode_callback = function(qrcode) {
        lp_box_no = qrcode.lp_Box_No();          // SCAN DATA BOX NO 추출
        lp_part_no = qrcode.lp_Box_PartNo();     // SCAN DATA PART_NO 추출
        lp_box_qty = qrcode.lp_Order_Qty();      // SCAN DATA BOX QTY 추출
        lp_box_lot_no = qrcode.lp_LotNo();       // SCAN DATA LOT_NO 추출
        lp_box_BoxSeq = qrcode.lp_BoxSeq();      // SCAN DATA Box Sequence 추출
        lp_box_Prt = qrcode.lp_Prt();            // SCAN DATA 출력 유형 추출
        lp_box_vendcd = qrcode.lp_Vendor();      // SCAN DATA VEND_CD 추출

        console.log("lp_box_no : "+ lp_box_no);
        console.log("lp_part_no : "+ lp_part_no);
        console.log("lp_box_qty : "+ lp_box_qty);
        console.log("lp_box_lot_no : "+ lp_box_lot_no);
        console.log("lp_box_BoxSeq : "+ lp_box_BoxSeq);
        console.log("lp_box_Prt : "+ lp_box_Prt);
        console.log("lp_box_vendcd : "+ lp_box_vendcd);
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