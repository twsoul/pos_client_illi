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
    var tmpSelected = null;
    var saveflag = false;

    var C1_LIST = [];
    var C2_LIST = [];
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var over_chk = false;

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
        })

        // 저장위치 변경 시 스캔 포커스
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
            	'TYPE': ["90"]
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

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if(inputScan.length > 0) {
            if($("#txtORDR_NO").text()== ""){
                MoveScan(inputScan);
            } else {
                if(Tot_Deli_Qty <= Tot_Scan_Qty && Tot_Deli_Qty != 0){
                    popupManager.instance($("[data-lng='MSG.0000000770']").text(), {showtime:"LONG"}); // 지시수량을 초과하여 스캔 할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                PalletScan(inputScan);
            }
        }
    }

    // 팔레트 정보 조회 함수
    var MoveScan = function(move_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_090_S1.do',
            data: {
                'MOVE_NO':move_no,
                'event':'반출 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.MOVE_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000288']").text(), {showtime:"LONG"}); // 이미 반출된 반출번호입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#selPLANT").attr("disabled",true);
                $("#selLOGI").attr("disabled",true);
                $("#list_pd_090_head").removeClass("blind");
                $("#txtORDR_NO").text(move_no);

                var template = $("#ListTemplate").html();
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{MOVE_QTY\}\}/, rowData.MOVE_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, 0);
                    Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);
                });
                $("#list_pd_090").append(tag);
                $("#inputScan").focus();
            }
        });
    };

    // Pallet 조회 함수
    var PalletScan = function(plt_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectVwPallet.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT").val(),
                'PLT_NO':plt_no,
                'event':'팔레트 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLT_LOC_CD != "A02"){
                    popupManager.instance($("[data-lng='MSG.0000000666']").text(), {showtime:"LONG"}); // 불출할 수 없는 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000667']").text(), {showtime:"LONG"}); // 보류된 TM이 존재하는 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.MAP_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000668']").text(), {showtime:"LONG"}); // 공팔레트 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LIMIT_FLAG == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000669']").text(), {showtime:"LONG"}); // 유수명이 만료된 TM이 존재합니다
                    $("#inputScan").focus();
                    return;
                }
                var exists = false;

                // 팔레트 중복 스캔 방지
                $.each(C1_LIST,function(key,value){
                      $.each(value,function(key,value){
                            if(value == plt_no){
                                exists = true;
                            }
                      });
                 });

                if(exists){
                    popupManager.instance($("[data-lng='MSG.0000000394']").text(), {showtime:"LONG"}); // 이미 스캔한 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }

                var template = $("#ListTemplateAll").html();
                var tag = "";

                $("#list_pd_090 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        console.log("SCAN_QTY : "+parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.MAP_QTY));
                        console.log("MOVE_QTY : "+parseInt($(this).find(".MOVE_QTY").text()));
                        if(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.MAP_QTY) >parseInt($(this).find(".MOVE_QTY").text())){
                            console.log("초과");
                            popupManager.instance($("[data-lng='MSG.0000000770']").text(), {showtime:"LONG"}); // 지시수량을 초과하여 스캔 할 수 없습니다
                            $("#inputScan").focus();
                            return false;
                        }
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.MAP_QTY));

                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                            over_chk = true;
                            $(this).find(".SCAN_QTY").removeClass("nBluebox1").addClass("nRedbox1");
                        }
                        if(parseInt($(this).find(".SCAN_QTY").text()) == parseInt($(this).find(".MOVE_QTY").text())){
                            $(this).find(".SCAN_QTY").removeClass("nRedbox1").addClass("nBluebox1");
                        }
                        Tot_Scan_Qty += parseInt(rowData.MAP_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }

                        tag += template.replace(/\{\{PALLET_NO\}\}/gi, plt_no)
                                       .replace(/\{\{QTY\}\}/gi, rowData.MAP_QTY)
                                       .replace(/\{\{LB0000000406\}\}/, $("[data-lng='LB.0000000406']").text())   // 팔레트
                                       .replace(/\{\{LB0000000019\}\}/, $("[data-lng='LB.0000000019']").text());  // 수량
                        $(this).parent().find(".papers_list").removeClass("blind").append(tag);



                        //$(this).prependTo('div .list_pd_090:eq(1)');
                        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "MOVE_NO":$("#txtORDR_NO").text(), "PLT_NO":plt_no,  "USER_ID":getUSER_ID, "RTN_MSG":""});
                        exists = true;
                    }
                });
                if(!exists){
                    popupManager.instance($("[data-lng='MSG.0000000543']").text(), {showtime:"LONG"}); // 품번이 리스트에 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
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
        if(Tot_Deli_Qty != Tot_Scan_Qty || over_chk == true){
            popupManager.instance($("[data-lng='MSG.0000000630']").text(), {showtime:"LONG"}); // 문서의 지시수량과 스캔수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }

        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_090_C1.do',
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

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_pd_090").html("");
        $("#list_pd_090_head").addClass("blind");
        $("#txtORDR_NO").text("");

        C1_LIST.length = 0;
        Tot_Scan_Qty = 0;
        Tot_Deli_Qty = 0;
        over_chk = false;

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        saveflag = false;
        $("#inputScan").focus();
    }

    // 아코디언 동작 함수
    var accordionEvent = function(obj) {
        console.log("tmpSelected1 : "+tmpSelected);
        console.log($(obj).attr('class'));
        $("[data-instance-class='accordion-content']").css('height', 0);
        $("[data-instance-class='accordion-handler']").removeClass('on');
        if(tmpSelected != $("[data-instance-class='accordion-handler']").index(obj)){
            $(obj).find("[data-instance-class='accordion-content']").css('height', '100%');
        	/*$(obj).find("[data-instance-class='accordion-content']").css('height', $(obj).find('li').length() * $(obj).find('li').height());*/
        	$(obj).addClass('on');
        	tmpSelected = $("[data-instance-class='accordion-handler']").index(obj);
        	console.log("tmpSelected2 : "+tmpSelected);
        }else{
        	$(obj).find("[data-instance-class='accordion-content']").css('height', 0);
        	tmpSelected = null;
        	console.log("tmpSelected3 : "+tmpSelected);
        }
        console.log("tmpSelected4 : "+tmpSelected);
    }

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		accordionEvent: accordionEvent,
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