
//localStorage Encapsulation
var lstorage = {
    storage: window.localStorage,
    set: function(key, value) {

        this.storage.setItem(key, JSON.stringify(value));
        return true;
    },
    get: function(key) {
        var temp = this.storage.getItem(key);
        return temp && JSON.parse(temp);
    },
    init: function() {
        for (var i in this.storage) {
            this.storage.removeItem(i)
        }
    }
};

window.onbeforeunload = function() {}

$(document).ready(function() {

    //数据重新加载初始化
    var winners=[];
    if (lstorage.get("LUCKER_LIST")) {
        lstorage.get("LUCKER_LIST").map(function(a) {
            winners.push(parseInt(a))
        });
    }
    var totalCount = lstorage.get("TOTAL_COUNT") > 0 ? lstorage.get("TOTAL_COUNT") : 0;

    var sound1, sound2, sound3;

    var loadSongs = function() {
        sound1 = new Audio("mp3/e.wav");
        sound1.load();
        sound2 = new Audio("mp3/e2.wav");
        sound2.load();
        sound3 = new Audio("mp3/e3.wav");
        sound3.load();
    };
    //canvas random
    var randomsort = function() {
        return Math.random() > .5 ? -1 : 1; //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
    }
    //Build canvas list
    var buildLi = function(count) {
        var canvas = $(".canvas");
        var hdimages = [];
        var html = [];
        var li = '<li class="item_box" data-name=\"{name}\"><div class="envelope"></div><p data-number=\"{number}\">奖</p></li>';
        for (var i = 1; i <= count; i++) {
            var li_index = Math.round(Math.random() * count.length);
            html.push(li.replace(/\{li\}/ig, i).replace(/\{number\}/ig, i).replace(/\{name\}/ig, Math.round(Math.random() * 100)));
        }
        html.sort(randomsort);
        canvas.html(html.join('\n'));
    };


    //add lucker to Lucky list
    var addWinner = eval(Wind.compile("async", function(no) {
        var target = $(".canvas li").eq(no).find("p");
        var chs = $(".chosen");
        var win = $(".winners ul");

        var li = $('<li class="item_box"></li>');
        var number = parseInt(target.attr("data-number"));
        winners.push(number);
        lstorage.set("LUCKER_LIST", winners)
        var winerBox = $("<p></p>").attr("data-number", number).html(number);
        li.append(winerBox);
        win.append(li);
        $("#winner_count").html(winners.length);
        chs.addClass("blink");
        $await(Wind.Async.sleep(1200));
		$(".winners").animate({
			scrollTop:"10000px"
		}, 0);
        chs.removeClass("blink");
    }));


    //draw animation
    var animate = eval(Wind.compile("async", function(idx) {
        var others = $(".canvas li").removeClass("active");
        var target = $(".canvas li").eq(idx).addClass("active");
    }));

    //build canvas
    var buildCanvas = function(count) {
        var canvas = $(".canvas").html("");
        var ul = $("<ul></ul>");
        for (var i = 0; i < count; i++) {
            var li = $("<li></li>");
            li.html(i + 1);
            ul.append(li);
        };
        canvas.append(ul);
    };

    //cancel draw lottery animation
    var finishLottery = function() {
        var chs = $(".chosen");
        chs.fadeOut();
        $(".canvas li").removeClass("active");
        $("#lottery").removeAttr('disabled')
    };

    var heartBeat = eval(Wind.compile("async", function(interval, count, itv, max_winner) {
        var c = itv;
        if (max_winner <= winners.length || totalCount <= winners.length) {
            finishLottery();
            alert('Draw end!');
            return;
        }
        while (true) {
            var no = 0;

            do {
                no = Math.floor(Math.random() * count);
            } while (jQuery.inArray(parseInt($(".canvas li").eq(no).find("p").attr("data-number")), winners) != -1);
            try {
                sound1.play();
            } catch (e) {}
            $await(animate(no));
            $await(Wind.Async.sleep(interval));
            if (--c == 0) {
                c = itv;
				//current max winners
		        lstorage.set("MAX_WINNER", max_winner);
                $await(addWinner(no));
            }
            if (max_winner <= winners.length || totalCount <= winners.length) {
                finishLottery();
                break;
            }
        }


    }));
	//loading ring
    loadSongs();

    var max_winner = 0;
    var animation_count = 35;
    var itv = 100; //ms

    $(document).on("click", '#lottery', function() {
		startLottery();
    });
	$(document).on("keyup", function(e) {
		if(e.keyCode==32){
			startLottery();
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	});
	//draw a lottery
	function startLottery(){
		var winnerNumber = 1;
		var $btnElm = $("#lottery")
        if ($btnElm.attr('disabled')) {
            return;
        }
        if (parseInt(winnerNumber) > totalCount) {
            alert("抽奖人数不能大于总人数！");
            return;
        }
        if (!totalCount || totalCount <= 0) {
            alert("请初始化抽奖号码!");
            return;
        }
        $btnElm.attr('disabled', 'disabled');
        max_winner += parseInt(winnerNumber);

        heartBeat(itv, totalCount, animation_count, max_winner).start();
	}
	$(document).on("click","#lottery_number",function(){
		$("#choose_count,#lottery_number").attr('disabled', "disabled");
		totalCount = parseInt($("#choose_count").val());
		if (!totalCount > 0) {
			return false;
		}

		lstorage.set("TOTAL_COUNT", totalCount);
		buildLi(totalCount);
	})
    //初始化数据
    $(document).on("keyup", "#choose_count", function(e) {
        if (e.keyCode == '13') {
            $("#choose_count,#lottery_number").attr('disabled', "disabled");
            totalCount = parseInt($(this).val());
            if (!totalCount > 0) {
                return false;
            }

            lstorage.set("TOTAL_COUNT", totalCount);
            buildLi(totalCount);
        }

    });
    //重新初始化
    $(document).on("click", '#lottery_init', function() {
        if (!confirm("真的要重来么？")) return false
        winners = [];
        lstorage.init();
        $(".winners ul").html('');
        max_winner = 0;
        buildLi(0);
        $("#winner_count").html(0);

        $("#choose_count,#lottery_number").attr('disabled', false).val(0);
    });
	//执行初始化
    (function() {
        var html = [];
        winners.map(function(a) {
            var template = '<li class="item_box"><p data-number="{number}">{number}</p></li>'
            html.push(template.replace(/\{number\}/ig, a))
        })
        $("#choose_count").val(totalCount);
        buildLi(totalCount);
		if(totalCount>0) $("#lottery_number").attr("disabled","disabled")
        max_winner = lstorage.get("MAX_WINNER");
        $(".winners ul").html(html.join("\n"));
        $("#winner_count").html(winners.length);
    })();

	$("#checkWinnerList").click(function(){
		var self = $(this);
		if(self.hasClass("active")){
			self.removeClass("active");
			$(".winners").animate({
				"height":"200px",
				"width":"100%"
			});
			$("body").css({
				'overflow-y':'auto'
			});
			self.html('查看获奖者');
		}else{
			self.addClass("active");
			$(".winners").animate({
				"height":"100%",
				"width":"100%",
			});
			$("body").css({
				'overflow-y':'hidden'
			});
			self.html('收起')
		}
	});

})
