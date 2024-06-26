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

    var refresh_timer;
    var refresh_time;
    //var temp;
	// 화면 초기화
	var setInitScreen = function() {
        deli_list_select();
	    //3번째 화면 자동으로 호출
	    //debugger;
	    get_refresh_time();
	    //debugger;
	    //typeof Number(refresh_time) * 1000

//        deli_list_select();
//        $("#inputScan").focus();
	};
    // refresh 주기 조회
    var get_refresh_time = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/COMM_CD_CALL.do',
            data: {
                'CODE':"REFRESH"
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(receivedData.ListCount == 0){
                        popupManager.instance("Refresh Time null", {showtime:"LONG"});

                        //기본 5초
                        refresh_time =5;
                        return;
                }
                $.each(receivedData.ListData, function(index,rowData){
                    refresh_time = Number(rowData.CD_DESC1);
                });
                refresh_timer = setInterval(deli_list_select, Number(refresh_time)* 1000);
                },
            error: function(errorCode, errorMessage, setting) {
                popupManager.instance("Refresh Time null", {showtime:"LONG"});
                refresh_timer = setInterval(deli_list_select, 5000);
            }
        });
    }

    $("#header").on("click", function() {
    //deli_list_select();
            });
	// 이벤트 초기화
	var setInitEvent = function() {


    };
    // on Hide
	var setOnHideEvent =  function(){
	}

    // deli_no 조회
    var deli_list_select = function(){
        //debugger;
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
                //debugger;
                setListRowEvent();

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
	        //3번째 화면 자동으로 호출
	        //get_refresh_time();
//            get_refresh_time();
//            refresh_timer = setTimeout(deli_list_select(), typeof Number(refresh_time) * 1000);
//            setListRowEvent();
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
		setReloadEvent: setReloadEvent,
        setOnHideEvent: setOnHideEvent
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
	page.setOnHideEvent();
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
	page.setReloadEvent();
}).onBack(function() {
    console.log("back_press");
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});