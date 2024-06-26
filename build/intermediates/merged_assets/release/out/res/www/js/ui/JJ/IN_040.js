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

    var Box_BarCode_Arr = [];
    var Box_No_Arr = [];
    var Deli_List_Arr = [];
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;
    var deli_flag = false; // 납입문서가 존재 하는지 체크 하는 flag
    var deli_loc_tp = false;
    var OTHER_FLAG = false;
    var sPlant = "";
    var sLocTp = "";

    var PLANT_CD = "";
    var LOC_TP = "";
    var ORDR_NO = "";
    var PART_CNT = "";
    var STATUS = "";
    var VEND_NM = "";
    var VEND_CD = "";
    var DELI_BAR_NO = "";
    var plant_cd = "";
    var deli_CASE = "";
    var other_plant_flag = "Y";

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
            if(deli_flag == false) {
                if(!head_tail_chk(inputScan)){
                    deli_no = inputScan;
                }else{
                    deli_no = deliBarProcessing(inputScan);
                }
                console.log("deli_no : "+deli_no);
                Deli_No_Sel(deli_no);
            } else if(deli_flag == true) {
                PartNoScan(inputScan);
            }
        }
    }

    var deliBarProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*09:DNKD012021110400001:PT1101:CK[45594-4G100=250,45594-4G100=250,45594-4G100=250]:*EOT
        var myResult = /:DN.{2,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            return "";
        }
    }

    var head_tail_chk = function(deli_bar_no){
        var head,tail;
        console.log(deli_bar_no);
        head = deli_bar_no.substr(0,4);
        console.log(head);
        tail = deli_bar_no.substr(deli_bar_no.length-4,4);
        console.log(tail);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // 납입 카드 정보 조회 함수
    var Deli_No_Sel = function(deli_bar_no){
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
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_TYPE != "K"){
                    popupManager.instance($("[data-lng='MSG.0000000314']").text(), {showtime:"LONG"}); // 올바르지않은 납입문서입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_ST != "30"){
                    popupManager.instance($("[data-lng='MSG.0000000464']").text(), {showtime:"LONG"}); // 운송중인 납입문서가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_ST == "99"){
                    popupManager.instance($("[data-lng='MSG.0000000508']").text(), {showtime:"LONG"}); // 발행 취소된 납입카드 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_CASE == undefined){
                    popupManager.instance($("[data-lng='MSG.0000000495']").text(), {showtime:"LONG"}); // 납품유형이 누락되었습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.IN_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000273']").text(), {showtime:"LONG"}); // 이미 납입된 납입카드 번호입니다
                    $("#inputScan").focus();
                    return;
                }
                var COLOR = "";


                var tag = "";
                var template = $("#ListTemplate").html();
                $.each(receivedData.ListData, function(index,rowData){
                    if(rowData.OVER_QTY <= 0){
                        COLOR = "nBluebox1";
                    } else {
                        COLOR = "nRedbox1";
                    }
                    tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{DELI_NO\}\}/, rowData.DELI_NO)
                                   .replace(/\{\{DELI_TYPE\}\}/, rowData.DELI_TYPE)
                                   .replace(/\{\{DELI_CASE\}\}/, rowData.DELI_CASE)
                                   .replace(/\{\{DELI_ST\}\}/, rowData.DELI_ST)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{DELI_QTY\}\}/gi, rowData.DELI_QTY)
                                   .replace(/\{\{BOX_IN_QTY\}\}/, rowData.BOX_IN_QTY)
                                   .replace(/\{\{BOX_QTY\}\}/, rowData.BOX_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                   .replace(/\{\{OVER_QTY\}\}/, rowData.OVER_QTY == undefined ? 0 : rowData.OVER_QTY)
                                   .replace(/\{\{COLOR\}\}/, COLOR)
                                   .replace(/\{\{OTHER_PLANT_MOVE_FLAG\}\}/, rowData.OTHER_PLANT_MOVE_FLAG)
                                   .replace(/\{\{IN_YN\}\}/, rowData.IN_YN)
                                   .replace(/\{\{INSP_FLAG\}\}/, rowData.INSP_FLAG)
                                   .replace(/\{\{BOX_BAR_FLAG\}\}/, rowData.BOX_BAR_FLAG)
                                   .replace(/\{\{SCAN_BOX_CNT\}\}/, "0");
                    Tot_Deli_Qty += parseInt(rowData.DELI_QTY);
                    if(rowData.OTHER_PLANT_MOVE_FLAG == "N"){
                        other_plant_flag = rowData.OTHER_PLANT_MOVE_FLAG;
                    }
                });
                other_plant_flag = "N";
                $("#selLOCTP").attr("disabled",true);
                $("#selPLANT").attr("disabled",true);
                $("#list_in_040_head").removeClass("blind");
                deli_flag = true;
                deli_CASE = rowData.DELI_CASE;
                plant_cd = rowData.PLANT_CD;
                $("#list_in_040").append(tag);
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

    // 스캔 시 부품식별표별 품번 조회
    var PartNoScanTemp = function(DBlist) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNoTemp.do',
            data: {
                'BOX_BAR_NO':DBlist,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                $.each(receivedData.ListData, function(index,rowData){
                    if(rowData.EX_FLAG == "Y"){
                        var query = 'DELETE FROM INBOX WHERE DELINO = "'+$("#txtORDR_NO").text()+'" AND BOXBAR = "'+rowData.BOX_BAR_NO+'"';
                        M.db.execute(getUSER_ID, query, function(status, result,  name) {
                        });
                    }else{
                        var insp_flag = "";
                        $("#list_in_040 .tableCont").each(function() {
                            if($(this).data("part_cd") == rowData.PART_CD){
                                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                                $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                                    over_chk = true;
                                    $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                                }
                                if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                                    $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                                }
                                Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                                    over_chk = true;
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                                insp_flag = $(this).data("inspflag");
                                $(this).prependTo('div .list_in_040:eq(1)');
                            }
                        });
                        Box_No_Arr.push(rowData.BOX_NO);
                        Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "USER_NM":getUSER_NM, "USER_ID":getUSER_ID, "RTN_MSG":""});
                    }
                });
                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표별 품번 조회
    var PartNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;
                var bar_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }

                if(rowData.EX_FLAG == "Y"){
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

                $("#list_in_040 .tableCont").each(function() {
                    if($(this).data("part_cd") == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                        $(this).find(".SCAN_BOX_CNT").text(parseInt($(this).find(".SCAN_BOX_CNT").text()) + 1);
                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".DELI_QTY").text())){
                            over_chk = true;
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".DELI_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }
                        Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                        insp_flag = $(this).data("inspflag");
                        $(this).prependTo('div .list_in_040:eq(1)');
                    }
                });
                if(!exists){
                    Box_No_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000271']").text(), {showtime:"LONG"}); // 납입카드에 해당 부품식별표가 존재 하지 않습니다
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
                    Box_BarCode_Arr.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "DELI_CASE":deli_CASE, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "INV_QTY":rowData.BAR_QTY, "USER_NM":getUSER_NM, "USER_ID":getUSER_ID, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty<Tot_Deli_Qty){
            popupManager.alert($("[data-lng='MSG.0000000274']").text(), { // 미납 되었습니다, 그래도 저장 하시겠습니까?
            title: '미납 저장 여부 메시지',
            buttons: ['예', '아니오']
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    save();
                }
            });
        }else if(Tot_Scan_Qty > Tot_Deli_Qty || (Tot_Scan_Qty == Tot_Deli_Qty && over_chk == true)){
            popupManager.alert($("[data-lng='MSG.0000000275']").text(), { // 과납 되었습니다, 그래도 저장 하시겠습니까?
            title: '과납 저장 여부 메시지',
            buttons: ['예', '아니오']
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    save();
                }
            });
        }else{
            save();
        }
    }

    var save = function() {
        saveflag = true;
        $("#list_in_040 .tableCont").each(function() {
            Deli_List_Arr.push({"COPORATE_CD":$(this).data("coperatecd"), "PLANT_CD":$(this).data("plantcd"),"LOC_TP":$("#selLOCTP").val(), "DELI_NO":$("#txtORDR_NO").text(), "PART_CD":$(this).find(".PART_CD").text(), "DELI_QTY":$(this).data("deliqty"), "SCAN_QTY":$(this).find(".SCAN_QTY").text(), "SCAN_CNT":$(this).find(".SCAN_BOX_CNT").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });
        $.each(Deli_List_Arr,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        $.each(Box_BarCode_Arr,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_IN_040_C1.do',
            data: {
                'param1': Deli_List_Arr,
                'param2': Box_BarCode_Arr
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    Deli_List_Arr.length = 0;
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                Deli_List_Arr.length = 0;
                saveflag = false;
            }
        });
    }

    var clear = function() {
        console.log("clear");
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        over_chk = false;
        deli_flag = false;
        deli_loc_tp = false;
        OTHER_FLAG = false;
        deli_CASE = "";
        other_plant_flag = "Y";
        plant_cd = "";

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

        Box_BarCode_Arr.length = 0;
        Deli_List_Arr.length = 0;
        Box_No_Arr.length = 0;

        $("#list_in_040").html("");
        $("#txtORDR_NO").text("");
        $("#txtVEND_CD").text("");
        $("#txtVEND_NM").text("");
        $("#list_in_040_head").addClass("blind");
        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
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