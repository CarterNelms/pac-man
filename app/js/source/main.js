(function()
{
	'use strict';

	/* 0: Minimum row count
	 * 0: Mamimum row count
	 * 0: Minimum column count
	 * 0: Mamimum column count
	 */
	var rowAndColCountRange = [3, 12, 3,12];

	var $start;
	var $board;
	var chompSound = new Audio('media/sounds/pacman_chomp-new.wav');

	$(document).ready(initialize);

	function initialize()
	{
		$start = $('#start');
		$board = $('#board');
		$(window).resize(sizeSprites);
		$start.click(start);
	}

	function start()
	{
		$start.off('click');
		$('#home').css('visibility', 'hidden');
		$('#menu').css('visibility', 'hidden');
		$board.css('visibility', 'visible');

		newRound();
	}

	function newRound()
	{
		setPlayerCanMove(true);
		buildGameBoard();
		setSprites();
		checkForWin();
	}

	function buildGameBoard()
	{
		// The number of rows and columns
		var rowAndColCount = [];
		// The game cells' height and width
		var cellDimensions = [];
		for(var i = 0; i < 2; ++i)
		{
			rowAndColCount[i] = Math.floor(Math.random()*(rowAndColCountRange[2*i+1]-rowAndColCountRange[2*i])+rowAndColCountRange[2*i]);
			cellDimensions[i] = (100/rowAndColCount[i])+'%';
		}

		for(var r = 0; r < rowAndColCount[0]; ++r)
		{
			var $row = $('<div>').addClass('gameRow');
			$row.css('height', cellDimensions[0]);

			for(var c = 0; c < rowAndColCount[1]; ++c)
			{
			var $cell = $('<div>').addClass('gameCell');
			$cell.css('width', cellDimensions[1]);

			$cell.attr({
				'data-x': c,
				'data-y': r
			});

			$row.append($cell);
			}
			$board.append($row);
		}
	}

	function setSprites()
	{
		var $player = $('<div>').addClass('player');
		var $pellet = $('<div>').addClass('pellet');

		$randomCell().append($player);
		$randomCell().append($pellet);

		sizeSprites();
	}

	function $randomCell()
	{
		var x = Math.floor(Math.random() * $('.gameRow:first-child .gameCell').length);
		var y = Math.floor(Math.random() * $('.gameRow').length);
		return $('.gameCell[data-x='+x+'][data-y='+y+']');
	}

	function sizeSprites()
	{
		var $anyOldCell = $('.gameCell[data-x=0][data-y=0]');
		var cellHeight = $anyOldCell.height();
		var cellWidth = $anyOldCell.width();
		var length = (cellHeight < cellWidth) ?
			cellHeight :
				cellWidth;

		var $player = $('.player');
		var $pellet = $('.pellet');

		// The numeric values here are the size of the preceding sprite as a fraction of the maximum size
		var spritesWithSizes = [
			$player, 1,
			$pellet, 0.5
		];

		for(var i = 0; i < spritesWithSizes.length/2; ++i)
		{
			var thisLength = length * spritesWithSizes[2*i+1];
			spritesWithSizes[2*i].css({
				width: thisLength,
				height: thisLength,
				top: (cellHeight-thisLength)/2,
				left: (cellWidth-thisLength)/2
			});
		}
	}

	function movePlayer(event)
	{
		var key = event.keyCode;
		if(key >= 37 && key <= 40)
		{
			event.preventDefault();

			var $oldCell = getCell($('.player'));
			var xOffset = 0;
			var yOffset = 0;
			var rotationAngle;
			switch(event.keyCode)
			{
				case 38:
					yOffset -= 1;
					rotationAngle = 270;
					break;
				case 40:
					yOffset += 1;
					rotationAngle = 90;
					break;
				case 37:
					xOffset -= 1;
					rotationAngle = 180;
					break;
				case 39:
					xOffset += 1;
					rotationAngle = 0;
			}

			var oldPos = getPos($oldCell);
			var $newCell = $('.gameCell' +
				'[data-x='+(oldPos[0]+xOffset)+']' +
				'[data-y='+(oldPos[1]+yOffset)+']'
			);

			if($newCell.length)
			{
				var $player = $('.player');
				var $animator = $('<div>').addClass('animator');

				$oldCell.append($animator);
				$animator.append($player);

				var leftOffset = $newCell.offset().left - $oldCell.offset().left;
				var topOffset = $newCell.offset().top - $oldCell.offset().top;

				rotatePlayer(rotationAngle);

				var moveTime = 450;

				triggerEatAnimation(moveTime, 4);

				loopAudio(chompSound, moveTime);

				$animator.animate(
					{
						left: leftOffset,
						top: topOffset
					},
					moveTime,
					'linear',
					function()
					{
						$newCell.append($player);
						$animator.remove();

						checkForWin();
					}	
				);
			}
		}
	}

	// function loopAudio(audio, time)
	// {
	// 	audio.play();
	// 	setTimeout(function()
	// 	{
	// 		audio.stop();
	// 	},
	// 	time
	// 	);
	// }

	function loopAudio(audio, playTime)
	{
		var startTime = Date.now();
		audio.addEventListener('ended', onEnded, false);
		audio.play();
		loop();

		function loop()
		{
			var currentTime = Date.now();
			var timePassed = currentTime - startTime;
			//console.log(timePassed);
			if(timePassed >= playTime)
			{
				//audio.load();
				//audio.play();
			// }
			// else
			// {
				console.log('Should end');
				audio.removeEventListener('ended', onEnded, false);
			}
		}

		function onEnded()
		{
			this.play();
			loop();
		}
	}

	function triggerEatAnimation(time, bites)
	{
		var bitesPerSecond = bites/(time/1000);
		var deltaTime = 1000/bitesPerSecond;

		var $player = $('.player');
		var counter = 0;
		eat();
		var mouthAnim = setInterval(function()
		{
			if(++counter < bites)
			{
				eat();
			}
			else
			{
				clearInterval(mouthAnim);
				$player.removeClass('animFrame2');
			}
		},
		deltaTime
		);

		function eat()
		{
			$player.toggleClass('animFrame2');
		}
	}

	function checkForWin()
	{
		var $player = $('.player');
		var $pellet = $('.pellet');

		var $playerCell = getCell($player);
		var $pelletCell = getCell($pellet);

		var playerPos = getPos($playerCell);
		var pelletPos = getPos($pelletCell);

		if(playerPos[0] === pelletPos[0] && playerPos[1] === pelletPos[1])
		{
			openMenu('You win!');
		}
	}

	function openMenu(text)
	{
		setPlayerCanMove(false);
		$('#menu').css('visibility', 'visible');

		var options = [
			'Continue',
			'Quit'
		];

		var $menuOptions = $('#menuOptions');

		$menuOptions.children().remove();

		for(var i = 0; i < options.length; ++i)
		{
			var $thisOption = $('<div>');
			$thisOption.text(options[i]);
			$menuOptions.append($thisOption);
		}

		$('#menuMessage').text(text);

		$('body').keydown(selectOptionKey);
		$menuOptions.on('click', 'div', selectOptionMouse);
	}

	function selectOptionKey(event)
	{
		var key = event.keyCode;

		var option;

		if(key === 67 || key === 81)
		{
			switch(key)
			{
				case 67:
					option = 'continue';
					break;
				default:
					option = 'quit';
			}
			selectOption(option);
		}
	}

	function selectOptionMouse()
	{
		selectOption($(this).text());
	}

	function selectOption(option)
	{
		endRound();

		stopMenuListen();

		switch(option.toLowerCase())
		{
			case 'continue':
				newRound();
				break;
			case 'quit':
				quit();
				break;
			default:
		}
	}

	function endRound()
	{
		$('.player').remove();
		$('.pellet').remove();
		$('#board > *').remove();
	}

	function quit()
	{
		$('#menu').css('visibility', 'hidden');
		$board.css('visibility', 'hidden');
		$('#home').css('visibility', 'visible');
		$start.click(start);
	}

	function stopMenuListen()
	{
		$('#menu').off('click');
		$('body').off('keydown');
		$('#menu').css('visibility', 'hidden');
	}

	function setPlayerCanMove(isPlayerMobile)
	{
		if(isPlayerMobile)
		{
			$('body').keydown(movePlayer);
		}
		else
		{
			$('body').off('keydown');  	
		}
	}

	function getPos($cell)
	{
		return [
			$cell.data('x'),
			$cell.data('y')
		];
	}

	function getCell($child)
	{
		return $child.parent('.gameCell');
	}

	function rotatePlayer(angle)
	{
		$('.player').css({
			'-webkit-transform' : 'rotate('+ angle +'deg)',
			'-moz-transform' : 'rotate('+ angle +'deg)',
			'-ms-transform' : 'rotate('+ angle +'deg)',
			'transform' : 'rotate('+ angle +'deg)'});
	}

})();