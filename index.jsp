<%@page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@include file="../common/systemHead.jsp"%>
<%
	String playSourceUrl = "./";
%>
<!DOCTYPE html>
<html>
<head>
<title>HTML5 可视化音乐播放器</title>
<link type="text/css" rel="stylesheet" href="<%=playSourceUrl%>/css/player.css" />
<style type="text/css">
</style>
</head>
<body>
	<div class="player-audio" id="player"></div>
</body>
<script src="<%=sourceUrl%>/js/jquery-1.8.2.min.js"></script>
<script src="<%=playSourceUrl%>/js/player.js" type="text/javascript"></script>
<script src="<%=playSourceUrl%>/js/player.layui.js" type="text/javascript"></script>
<script type="text/javascript">
	// 	$(function() {
	// 		window.myPlayer = new Player();
	// 		myPlayer.init({
	// 			elem : '#player',
	// 			autoPlay : true, //自动播放
	// 			showAdd : false,//是否打开的时候就显示添加窗口
	// 			playList : []
	// 		});
	// 	});
</script>
<script type="text/javascript">
	function layui_main() {
		//layui加载完毕：
		console.log('1.造一个对象.....');
		window.myPlayer = new LayPlayer();
		console.log('2.初始化数据.....');
		myPlayer.init({
			elem : '#player',
			autoPlay : true, //自动播放
			showAdd : false,//是否打开的时候就显示添加窗口
			playList : []
		});
// 		console.log('3.开始尝试追加列表.....');
// 		myPlayer.appendList([ {
// 			title : '梅香如故.mp3',
// 			artist : '5.81MB',
// 			size : 6099614,
// 			mp3 : './playAudio/temp.mp3'
// 		} ]);
// 		myPlayer.replay();
	}

	// 	function initMethod() {
	// 		if (window.myPlayer)
	// 			return;
	// 		window.myPlayer = new Player();
	// 		myPlayer.init({
	// 			elem : '#player',
	// 			autoPlay : true, //自动播放
	// 			effect : 0,//频谱效果,不设置或0为随机变化,1为条形柱状,2为环状声波,3 心电图效果
	// 			color : null,//"#01ff01",//颜色 color:16进制颜色代码,不设置或设置为空(空字符或null)将随机使用默认颜色
	// 			showAdd : false,//是否打开的时候就显示添加窗口（我要自定义）
	// 			add : addMethod,
	// 			button : {//设置生成的控制按钮,不设置button默认全部创建
	// 				prev : true,//上一首
	// 				play : true,//播放,暂停
	// 				next : true,//下一首
	// 				volume : true,//音量
	// 				progressControl : true,//是否开启进度控制
	// 				add : true, // 添加按钮
	// 				menu : true, // 菜单控制
	// 			},
	// 			error : function(e) {
	// 				//一些异常
	// 			},
	// 			event : function(e) {
	// 				//这是一个事件方法,点击控制按钮会到此方法
	// 				//参数:e.eventType 事件类型
	// 				//参数:e.describe 事件详情,或参数
	// 				//e.eventType  prev: 点击上一首,next：点击下一首,play:点击 播放/暂停
	// 				console.log(e);
	// 			},
	// 			energy : function(value) {
	// 				//此时播放的能量值,时刻变化
	// 				//console.log(value);
	// 			},
	// 			playList : []
	// 		});
	// 	}
</script>

</html>