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

    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var Box_No_List = [];

    var over_chk = false; // 품번 기준 과납 여부 플래그
    var cancel_flag = false;
    var deli_flag = false; // 요청번호가 스캔 되었는지 체크하는 플래그

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
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 수량 변경 체크 박스 변경 시
        $("#chk_Info").on("change", function() {
            $("#inputScan").focus();
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("40");
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
                    StorageLocationReq("40");
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

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
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
            if(deli_flag == false) { // 스캔된 요청 번호가 없을 경우
                OrderInfo(inputScan);
            } else if(deli_flag == true) {
                BoxNoScan(inputScan);
            }
        }
    }

    // 반출번호 조회 하는 함수
    var OrderInfo = function(orderNo){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_010_S1.do',
            data: {
                'MOVE_NO':orderNo,
                'LANG':getLNG,
                'event':'반출번호 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.MOVE_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000288']").text(), {showtime:"LONG"}); // 이미 반출된 반출번호입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                deli_flag = true;
                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_kd_010_head").removeClass("blind");
                    tag += template.replace(/\{\{MOVE_SEQ\}\}/gi, rowData.MOVE_SEQ)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{MOVE_NO\}\}/, rowData.MOVE_NO)
                                   .replace(/\{\{MOVE_TYPE\}\}/, rowData.MOVE_TYPE)
                                   .replace(/\{\{MOVE_GB\}\}/, rowData.MOVE_GB)
                                   .replace(/\{\{MOVE_DESC\}\}/gi, rowData.MOVE_DESC)
                                   .replace(/\{\{MOVE_SEQ\}\}/gi, rowData.MOVE_SEQ)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{MOVE_QTY\}\}/gi, rowData.MOVE_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{SCAN_QTY\}\}/, 0)
                                   .replace(/\{\{MOVE_YN\}\}/, rowData.MOVE_YN);
                   $("#list_kd_010").append(tag);
                   $("#txtORDR_NO").text(rowData.MOVE_NO);
                   Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);
                });
                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표별 품번 조회
    var BoxNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_010_S2.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_no_exists = false;
                var part_cd_exists = false;
                var move_seq = "";

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
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
                } else {
                    if(rowData.BAR_QTY == "0"){
                        $('#chk_Info').prop('checked', true);
                    }
                    $("#list_kd_010 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){
                            $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));

                            // 스캔한 수량이 불출할 수량 보다 많을 경우 과납 플래그(품번기준 수량)
                            if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                                if ($("#chk_Info").prop("checked")) { // 체크시
                                    cancel_flag = true;
                                } else { // 체크 해제시
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                    over_chk = true;
                                }
                            }

                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                            Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                            move_seq = $(this).data("moveseq");

                            if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체 스캔 수량과 전체 불출 수량이 일치 할때
                                if(!$("#chk_Info").prop("checked")) { // 체크 해제시
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                }
                            } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔 수향이 불출 수량을 초과 할때(전체 수량)
                                if(!$("#chk_Info").prop("checked")) { // 체크 해제시
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                            }
                            part_cd_exists = true;
                        }
                    });
                }

                if(!part_cd_exists){
                    popupManager.instance($("[data-lng='MSG.0000000290']").text(), {showtime:"LONG"}); // 반출목록에 해당 부품식별표가 존재 하지 않습니다
                    $("#inputScan").focus();
                    return;
                } else {
                    Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "PART_CD":rowData.PART_CD, "MOVE_SEQ":move_seq, "MOVE_NO":$("#txtORDR_NO").text(), "MOVE_QTY":rowData.BAR_QTY, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                    if ($("#chk_Info").prop("checked")) { // 체크시
                        ScanPopup(rowData.BAR_QTY,rowData.PART_CD,rowData.BOX_NO);
                    } else { // 체크 해제시
                        $("#inputScan").focus();
                    }
                }
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

        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
            $.each(Box_No_List,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                $.each(value,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                });
            });

            save();
        } else {
            popupManager.alert($("[data-lng='MSG.0000000537']").text(), { // 미, 과납되었습니다. 그래도 저장하시겠습니까?
            title: $("[data-lng='MSG.0000000004']").text(), // 알림
            buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
            }, function(index) {
                if (index == 1){
                    $("#inputScan").focus();
                    return;
                } else {
                    $.each(Box_No_List,function(key,value){
                        console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                        $.each(value,function(key,value){
                            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                        });
                    });
                    save();
                }
            });
        }
    }

    // PR_PDA_KD_010_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_010_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                }
                clear();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_010").html("");
        $("#txtORDR_NO").text("");
        $("#list_kd_010_head").addClass("blind");

        Box_No_List.length = 0;
        over_chk = false;
        cancel_flag = false;
        deli_flag = false;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        saveflag = false;
        $("#inputScan").focus();
    }

    // 부품식별표 수량변경 팝업 함수
    var ScanPopup = function(bar_qty,part_cd,box_no){
        objScanInput = new InputChgQtyPopup({ title:$("[data-lng='LB.0000000532']").text(), id: "popChg", label:$("[data-lng='LB.0000000150']").text(),value:bar_qty,label2:$("[data-lng='LB.0000000535']").text(), type: "number", goBottom: true, submitCallback: function(val){
            console.log("val : "+val);
            var chg_qty = bar_qty;
            if(val == "cancel" || val == "0" || val == ""){
                if(cancel_flag){
                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                    over_chk = true;
                }
                Box_No_List.pop();

                $("#list_kd_010 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == part_cd){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) - parseInt(bar_qty));

                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())-1);
                        Tot_Scan_Qty -= parseInt(bar_qty);

                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체 스캔 수량과 전체 불출 수량이 일치 할때
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔 수향이 불출 수량을 초과 할때(전체 수량)
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                    }
                });

                if(val == "0"){
                    console.log("val 0");
                }
                if(val == ""){
                    console.log("val 공백");
                }

                setTimeout(function() {
                    $("#inputScan").focus();
                }, 1000);
                return;
            }
            if(val != ""){
                chg_qty = parseInt(val);
            }


            $("#list_kd_010 .tableCont").each(function() {
                if($(this).find(".PART_CD").text() == part_cd){
                    $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) - bar_qty);
                    $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + chg_qty);

                    // 스캔한 수량이 불출할 수량 보다 많을 경우 과납 플래그(품번기준 수량)
                    if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                        $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        over_chk = true;
                    }

                    Tot_Scan_Qty = Tot_Scan_Qty - bar_qty;
                    Tot_Scan_Qty = Tot_Scan_Qty + chg_qty;

                    if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체 스캔 수량과 전체 불출 수량이 일치 할때
                        $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                    } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔 수향이 불출 수량을 초과 할때(전체 수량)
                        $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                    }
                }
            });
            $.each(Box_No_List,function(key){
                if(Box_No_List[key]['BOX_NO'] == box_no){
                    Box_No_List[key]['MOVE_QTY'] = chg_qty;
                }
            });

            setTimeout(function() {
                $("#inputScan").focus();
            }, 1000);

        }});
        objScanInput.init();
        objScanInput.show();
        $("#popChg input").focus();
    }

    var inputEvent = function(obj) {
        console.log("inputEvent");
        if($(obj).val() == ""){
            $(obj).click();
        }
        if($(obj).val().indexOf('.') == 1){
            $(obj).val("");
        }
    };

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
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
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});