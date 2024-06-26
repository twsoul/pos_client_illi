/**
 * Created by Jeong chan woo on 2021. 6. 15..
 */
var qrManager = (function() {

    var QRcode = function(strBarcode) {
        // 바코드 형식
        // [)>*06 :3SKD20KKP00173 :P45552-3B021 :5Q1 :DKKP :6E00178 :2R03 :VJA33 :*EOT
        // [)>*06:3SD004QJ100001S:PT001:5Q050:D123:6E00001:2R03:VD004:*EOT

        this.src = strBarcode;
        console.log(this.src);
        this.lp_headtag = "[)>*06";
        this.lp_tailtag = "*EOT";
    }

    // ------------- lp box -------------
    QRcode.prototype.lp_box_Isvalid = function() {
        //중복바코드 동시스캔되는 경우 발생하여 체크로직 추가 211227 HWCHO
        var findArr = [];
        var idx = this.src.indexOf(this.lp_tailtag);
        var cnt = 0;
        while(idx != -1) {
            cnt++;
            idx = this.src.indexOf(this.lp_tailtag, idx + 1);
        }
        if(cnt > 1) {
            return false;
        }

        var head,tail;
        console.log(this.src);
        head = this.src.substr(0,6);
        console.log(head);
        tail = this.src.substr(this.src.length-4,4);
        console.log(tail);
        if ( (head==this.lp_headtag) && (tail==this.lp_tailtag) )
            return true;
        else
            return false;
    }

    // ------------- L_BOX_NO -------------
    QRcode.prototype.lp_Box_No= function() {
        var myResult = /:3S.{2,}/g.exec(this.src);
        console.log(myResult);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-8);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            return "";
        }
    }

     // ------------- PART_NO(품번) -------------
    QRcode.prototype.lp_Box_PartNo= function() {
        var myResult = /:P[0-9,A-Z](?!G,?!A).{1,}:/g.exec(this.src);
        if (myResult!=null) {
            var part_no = myResult[0].substr(2,myResult[0].length-3);

            if (part_no.indexOf(":")<0) {
                console.log(part_no);
                return part_no;
            }else{
                var strPart= part_no.substr(0,part_no.indexOf(":"));
                //strPart = strPart.replace(/-+/,"");
                console.log(strPart);
                return strPart;
            }
        }else{
            return "";
        }
    }

    // ------------- INV_QTY(BOX 수량) -------------
    QRcode.prototype.lp_Order_Qty = function() {
        var myResult = /:5Q[0-9,.,A-Z]{1,}:/g.exec(this.src);
        if (myResult!=null){
            var str = myResult[0];
            var qty="";
                for(var i=3; i<str.length; i++){
                    if(str.substr(i,1) >= "0" && str.substr(i,1) <= "9")
                        qty = qty + str.substr(i,1);
                    else
                    break;
            }
            console.log(qty);
            return qty;
        }else{
            return "";
        }
    }

    // ------------- VEND_CD(거래처 코드) -------------
    QRcode.prototype.lp_Vendor= function() {
        var myResult = /:V.{2,}:/g.exec(this.src);
        if (myResult!=null){
            var vendor = myResult[0].substr(2,myResult[0].length-3);
            if (vendor.indexOf(":")<0) {
                console.log(vendor);
                return vendor;
            }else{
                var strVendor= vendor.substr(0,vendor.indexOf(":"));
                strVendor = strVendor.replace(/-+/,"");
                console.log(strVendor);
                return strVendor;
            }
        }else{
            return "";
        }
    }

    // ------------- LOT_NO -------------
    QRcode.prototype.lp_LotNo= function() {
        var myResult = /:D.{1,}:/g.exec(this.src);
        if (myResult!=null){
            var LotNo = myResult[0].substr(2,myResult[0].length-3);

            if (LotNo.indexOf(":")<0) {
                console.log(LotNo);
                return LotNo;
            }else{
                var strLotNo = LotNo.substr(0,LotNo.indexOf(":"));
                strLotNo = strLotNo.replace(/-+/,"");
                console.log(strLotNo);
                return strLotNo;
            }
        }else{
            return "";
        }
    }

    // ------------- SEQ_NO -------------
    QRcode.prototype.lp_BoxSeq = function() {
        var myResult = /:6E.{1,}:/g.exec(this.src);
        if (myResult!=null){
            var BoxSeq = myResult[0].substr(3,myResult[0].length-3);

            if (BoxSeq.indexOf(":")<0) {
                console.log(BoxSeq);
                return BoxSeq;
            }else{
                var strBoxSeq = BoxSeq.substr(0,BoxSeq.indexOf(":"));
                strBoxSeq = strBoxSeq.replace(/-+/,"");
                console.log(strBoxSeq);
                return strBoxSeq;
            }
        }else{
            return "";
        }
    }

    // ------------- BOX_PRT(출력유형) -------------
    QRcode.prototype.lp_Prt = function() {
        var myResult = /:2R.{0,}:/g.exec(this.src);
        if(myResult!=null){
            var Prt = myResult[0].substr(3,myResult[0].length-3);

            if (Prt.indexOf(":") < 0) {
                console.log(Prt);
                return Prt;
            } else {
                var strPrt = Prt.substr(0,Prt.indexOf(":"));
                strPrt = strPrt.replace(/-+/,"");
                console.log(strPrt)
                return strPrt;
            }
        }else{
            return "";
        }
    }

    var isValidBarcode = function(qrcode){

        // head, tail 검사
        if(qrcode.lp_box_Isvalid() == false) { // 올바르지 않은 바코드 구성입니다
            console.log("올바르지 않은 바코드 구성");
            popupManager.instance($("[data-lng='MSG.0000000226']").text() + qrcode.lp_headtag + " != " + qrcode.src.substr(0,6) + "==" + qrcode.src, {showtime:"LONG"});
            return false;
        }

        // SCAN DATA BOX_NO 추출
        var lp_box_no = qrcode.lp_Box_No();
        if(lp_box_no == "") { // 바코드에 BOX NO가 존재하지 않습니다
            console.log("BOX NO가 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000227']").text(), {showtime:"LONG"});
            return false;
        }

        // SCAN DATA PART_NO 추출
        var lp_part_no = qrcode.lp_Box_PartNo();
        if(lp_part_no == ""){ // 바코드에 PART NO가 존재하지 않습니다
            console.log("PART NO가 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000228']").text(), {showtime:"LONG"});
            return false;
        }

        // SCAN DATA BOX QTY 추출
        var lp_box_qty = qrcode.lp_Order_Qty();
        if(lp_box_qty == "") { // 바코드에 BOX 수량이 존재하지 않습니다
            console.log("BOX 수량이 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000229']").text(), {showtime:"LONG"});
            return false;
        }

        // SCAN DATA VEND_CD 추출
        var lp_box_vendcd = qrcode.lp_Vendor();
        if(lp_box_vendcd == ""){ // 바코드에 업체코드가 존재하지 않습니다
            console.log("업체 코드가 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000230']").text(), {showtime:"LONG"});
            return false;
        }
        /*
        // SCAN DATA LOT_NO 추출
        var lp_box_lot_no = qrcode.lp_LotNo();
        if(lp_box_lot_no == ""){ // 바코드에 LOT NO가 존재하지 않습니다
            console.log("LOT NO가 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000231']").text(), {showtime:"LONG"});
            return false;
        }

        // SCAN DATA Box Sequence 추출
        var lp_box_BoxSeq = qrcode.lp_BoxSeq();
        if(lp_box_BoxSeq == ""){ // 바코드에 BOX Sequence가 존재하지 않습니다
            console.log("BOX Sequence가 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000232']").text(), {showtime:"LONG"});
            return false;
        }

        // SCAN DATA 출력 유형 추출
        var lp_box_Prt = qrcode.lp_Prt();
        if(lp_box_Prt == ""){ // 바코드에 출력유형이 존재하지 않습니다
            console.log("출력유형이 존재하지 않음");
            popupManager.instance($("[data-lng='MSG.0000000233']").text(), {showtime:"LONG"});
            return false;
        }*/
        return true;
    }

    var qrcode_callback = function(qrcode) {
        var frm = document.frm;

        lp_box_no1 = qrcode.lp_Box_No();          // SCAN DATA BOX NO 추출
        lp_part_no = qrcode.lp_Box_PartNo();     // SCAN DATA PART_NO 추출
        lp_box_qty = qrcode.lp_Order_Qty();      // SCAN DATA BOX QTY 추출
        lp_box_lot_no = qrcode.lp_LotNo();       // SCAN DATA LOT_NO 추출
        lp_box_BoxSeq = qrcode.lp_BoxSeq();      // SCAN DATA Box Sequence 추출
        lp_box_Prt = qrcode.lp_Prt();            // SCAN DATA 출력 유형 추출
        lp_box_vendcd = qrcode.lp_Vendor();      // SCAN DATA VEND_CD 추출

        frm.lp_box_no = lp_box_no1;
        frm.lp_part_no = lp_part_no;
        frm.lp_box_qty = lp_box_qty;
        frm.lp_box_lot_no = lp_box_lot_no;
        frm.lp_box_BoxSeq = lp_box_BoxSeq;
        frm.lp_box_Prt = lp_box_Prt;
        frm.lp_box_vendcd = lp_box_vendcd;

        frm.submit();

        return true;
    }

    /* qrManager 함수 사용시 html에 메시지 언어팩 추가
    <!--qrManagerLangPack-->
    <span class="blind" data-lng="MSG.0000000226">올바르지 않은 바코드 구성입니다</span>
    <span class="blind" data-lng="MSG.0000000227">바코드에 BOX NO가 존재하지 않습니다</span>
    <span class="blind" data-lng="MSG.0000000228">바코드에 PART NO가 존재하지 않습니다</span>
    <span class="blind" data-lng="MSG.0000000229">바코드에 BOX 수량이 존재하지 않습니다</span>
    <span class="blind" data-lng="MSG.0000000230">바코드에 업체코드가 존재하지 않습니다</span>
    <span class="blind" data-lng="MSG.0000000231">바코드에 LOT NO가 존재하지 않습니다</span>
    <span class="blind" data-lng="MSG.0000000232">바코드에 BOX Sequence가 존재하지 않습니다</span>
    <span class="blind" data-lng="MSG.0000000233">바코드에 출력유형이 존재하지 않습니다</span>
    */

    return {
        QRcode:             QRcode,
        isValidBarcode:     isValidBarcode,
        qrcode_callback:    qrcode_callback,
    }
})();