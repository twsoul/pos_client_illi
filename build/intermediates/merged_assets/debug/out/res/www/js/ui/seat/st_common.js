/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
//    var getCORP_CD = userManager.getCORP_CD();
//    var getUSER_NM = userManager.getUSER_NM();
//    var getUSER_ID = userManager.getUSER_ID();
//    var getWERKS = optionManager.getWERKS();
//    var getLGORT = optionManager.getLGORT();
//    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    // 부품식별표 바코드 Processing
    var lp_box_no = "";
    var lp_part_no = "";
    var lp_box_qty = "";
    var lp_box_lot_no = "";
    var lp_box_BoxSeq = "";
    var lp_box_Prt = "";
    var lp_box_vendcd = "";

    var blockMultiTap = false;          // 리스트 중복 탭 방지 플래그
    var other_plant_chk_flag = "N";     // 타 공장 여부를 납입 카드로 넘겨주는 플래그
    var reloadFlag = false;             // 리 로딩 플래그
    var pack_plant = "";                // PACK_DELI_NO 바코드 플랜트

	// 화면 초기화
	var setInitScreen = function() {
        deli_list_select();
//        $("#inputScan").focus();
	};


    $("#header").on("click", function() {
    deli_list_select();
            });
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
            clear();
        })

        // 저장위치 변경 시 스캔으로 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 초기화 버튼 클릭시
        $("#btnInit").on("click", function() {
            setClearClickEvent();
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
        var qrCode = new qrManager.QRcode(inputScan);
        var deli_code = "";
        var selected_plant = "";

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
            if(head_tail_chk(inputScan)){ // 부품식별표 스캔시
                if(!qrManager.isValidBarcode(qrCode)){ // 바코드 Validation Check
                    console.log("fail");
                    return;
                }
                qrcode_callback(qrCode);
                PartNoScan(pack_plant); // 부품식별표 처리
            }else{ // PACK_DELI_NO 스캔시
                // PACK_DELI_NO 플랜트 분리 DELI_NO(16) + PLANT_CD(4)
                deli_code = inputScan.substr(0,16);
                pack_plant = inputScan.substr(16,4);

                other_plant_chk_flag = "N"; // 타공장 여부 플래그 초기화
                if(pack_plant != userPlantCheck){
                    popupManager.alert($("[data-lng='MSG.0000000115']").text(), { // 타 공장 바코드입니다, 그래도 진행 하시겠습니까?
                    title: $("[data-lng='MSG.0000000004']").text(), // 알림
                    buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                    }, function(index) {
                        if (index == 1){
                            $("#inputScan").focus();
                            return;
                        }else{
                            other_plant_chk_flag = "Y"; // 타 공장인 경우
                            DeliBarScan(deli_code,pack_plant);
                        }
                    })
                } else {
                    DeliBarScan(deli_code,pack_plant);
                }
            }
        }
    }

    // 부품식별표 head, tail 체크
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

    // deli_no 조회
    var deli_list_select = function(){
        debugger;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/DELI_NO_LIST_1.do',
            data: {
                'location':"B"
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                    //$("#inputScan").focus();
                    return;
                }
        debugger;
                var tag = "";
                var template = $("#ListTemplate").html();

                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{DLY_DATE\}\}/gi, rowData.DLY_DATE)
                                   .replace(/\{\{PO_SEQ\}\}/gi, rowData.PO_SEQ)
                                   .replace(/\{\{DELI_NO\}\}/gi, rowData.DELI_NO)
                                   .replace(/\{\{OUT_DIV\}\}/, rowData.OUT_DIV)
                                   .replace(/\{\{MLINK\}\}/, "mLink"
                                   );
                });

                //$("#txtORDR_NO").text(deli_bar_no);
                $("#list_SEAT_001").html("");
                $("#list_SEAT_001_head").removeClass("blind");
                $("#list_SEAT_001").append(tag);
                setListRowEvent();

                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표별 품번 조회
    var PartNoScan = function(plant_cd) {
        $("#list_in_010 .tableCont").removeClass("nPinkbox1");
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_010_S2.do',
            data: {
                'PLANT_CD': plant_cd,
                'PACK_ORDR_NO':$("#txtORDR_NO").text(),
                'PART_CD':lp_part_no,
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

                var count = 0;
                var plant_cd = "";
                var ordr_no = "";
                var deli_bar_no = "";

                $.each(receivedData.ListData, function(index,rowData){
                    $("#list_in_010 .tableCont").each(function() {
                        console.log("table ORDR_NO : "+$(this).find(".ORDR_NO").text());
                        console.log("rowdata ORDR_NO : "+rowData.ORDR_NO);
                        if($(this).find(".ORDR_NO").text() == rowData.ORDR_NO){
                            $(this).addClass("nPinkbox1");
                            plant_cd = $(this).find(".PLANT_CD").text();
                            ordr_no = $(this).find(".ORDR_NO").text();
                            count ++;
                        }
                    });
                });

                // 리스트에 존재하는 품번이 하나일 경우 IN_020으로 바로 이동동
               if(count == 1){
                    reloadFlag = true;
                    screenManager.moveToPage("IN_020.html", {
                        param: {
                            sPLANT: M.sec.encrypt($("#selPLANT option:selected").val()).result,
                            sLOCTP: M.sec.encrypt($("#selLOCTP option:selected").val()).result,
                            PLANT_CD: M.sec.encrypt(plant_cd).result,
                            ORDR_NO: M.sec.encrypt(ordr_no).result,
                            DELI_BAR_NO: M.sec.encrypt(deli_bar_no).result,
                            OP_CHECK: M.sec.encrypt(other_plant_chk_flag).result
                        }
                    });
                }

                $("#inputScan").focus();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    }

    // 화면 초기화
    var clear = function() {
        $("#list_in_010").html("");

        $("#list_in_010_head").addClass("blind");
        $("#txtORDR_NO").text("");

        lp_box_no = "";
        lp_part_no = "";
        lp_box_qty = "";
        lp_box_lot_no = "";
        lp_box_BoxSeq = "";
        lp_box_Prt = "";
        lp_box_vendcd = "";

        blockMultiTap = false; // 리스트 중복 탭 방지 플래그
        other_plant_chk_flag = "N"; // 타 공장 여부를 납입 카드로 넘겨주는 플래그
        reloadFlag = false;

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
	    if(reloadFlag){
	        // 화면 초기화 후 리로딩
            blockMultiTap = false;
            reloadFlag = false;

            $("#list_in_010").html("");
            $("#list_in_010_head").addClass("blind");

            DeliBarScan($("#txtORDR_NO").text(),pack_plant);

            $("#inputScan").focus();
	    }
	};

	// 리스트에 클릭 이벤트 등록
    var setListRowEvent = function(){
        $(".mLink").off("click","**");
        $(".mLink").on("click", function(){
            if(!blockMultiTap){ // 중복 리스트 클릭 방지
                blockMultiTap = true;
                reloadFlag = true;
                screenManager.moveToPage("SEAT_002.html", {
                    param: {
                        /*sPLANT: M.sec.encrypt($("#selPLANT option:selected").val()).result,
                        sLOCTP: M.sec.encrypt($("#selLOCTP option:selected").val()).result,
                        PLANT_CD: M.sec.encrypt($(this).find(".PLANT_CD").text()).result,
                        ORDR_NO: M.sec.encrypt($(this).find(".ORDR_NO").text()).result,
                        DELI_BAR_NO: M.sec.encrypt($(this).data("delibarno")).result,
                        OP_CHECK: M.sec.encrypt(other_plant_chk_flag).result*/
                        DELI_NO: M.sec.encrypt($(this).find(".DELI_NO").text()).result
                    }
                });
            }
        })
    };
    $("#btn_back").on("click", function(){
		page.moveToBack();
	});
    // DELI_NO가 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(deli_no){
        var rtn = false;
        $("#list_in_010 .tableCont").each(function() {
            if($(this).data("delino") == deli_no){
                rtn = true;
                return false; // each 문의 break;
            }
        });
        return rtn;
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