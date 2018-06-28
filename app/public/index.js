// players.state {hand: [int]}
// state.deck [int]
// state.terms [{index: int, word: string, definition: string, image: string}]
// state.board [int]
// state.handSize int
// state.boardSize int
// state.title string
// state.setId int

$(document).ready(function() {
	$('#door').click(door);
	$('#leave').click(leave);
	$('#set_id_form').submit(prepare);
	$('#set_id_input').on('input', function() { $('#set_id_select').val('select_set'); });
	$('#set_id_select').change(selectSet);
	loadSets();
});

function newState() {
	if (state.currentPlayer >= 0) return { hand: newHand() };
	return {};
}

function loadSets() {
	$.get('query/sets', function(response) {
		for (var setId in response) {
			$('<option>').val(setId).text(response[setId]).appendTo('#set_id_select');
		}
	});
}

function selectSet() {
	var val = Number.parseInt($(this).val());
	if (!isNaN(val)) $('#set_id_input').val(val);
}

function prepare() {
	var setId = $('#set_id_input').val();
	$.get('query?id=' + setId, function(response) {
		state.title = response.title;
		state.setId = response.id;
		state.terms = response.terms;
		state.currentPlayer = adminIndex;
		// todo address equal terms
		state.deck = state.terms.map(function(term) {
			return term.index;
		});
		shuffleArray(state.deck);
		state.handSize = $('#hand_size').val();
		state.boardSize = $('#board_size').val();
		for (var i = 0; i < state.players.length; i++) {
			state.players[i].state.hand = newHand();
		}
		state.board = state.deck.splice(0, state.boardSize);
		sortBoard();
		sendState('prepare');
	});
	return false;
}

function sortBoard() {
	state.board.sort(function(a, b) {
		return a - b;
	});
}

function newHand() {
	return state.deck.splice(0, state.handSize);
}

function update() {
	$('#set_title').text(state.title);
	$('#set_id').text(state.setId);

	if (state.currentPlayer < 0) return victory();

	show('#qorder_game');

	$('#game_players').empty();
	state.players.forEach(function(player) {
		$('<div>')
			.addClass('bubble')
			.addClass('inline')
			.append(
				$('<p>').text(
					player.name + ' (' + player.state.hand.length + ')'
				)
			)
			.appendTo('#game_players');
	});
	$('#hand').empty();
	me().state.hand.forEach(function(index) {
		var card = state.terms[index];
		$('<div>')
			.addClass('center-parent')
			.addClass('bubble')
			.addClass('card')
			.append($('<p>').text(card.word))
			.append($('<br>'))
			.append(
				$('<img>')
					.attr('src', card.image)
					.addClass('card_img')
			)
			.addClass('hand_card')
			.click(pick)
			.appendTo('#hand');
	});
	$('#board').empty();
	state.board.forEach(function(index, position) {
		makeBoardButton();
		$('<div>')
			.addClass('center-parent')
			.addClass('bubble')
			.addClass('card')
			.append($('<p>').text(state.terms[index].word))
			.append($('<p>').text(state.terms[index].definition))
			.append(
				$('<img>')
					.attr('src', state.terms[index].image)
					.addClass('card_img')
			)
			.appendTo('#board');
	});
	makeBoardButton();
}

function makeBoardButton() {
	$('<button>')
		.addClass('bubble')
		.addClass('board_button')
		.click(play)
		.appendTo('#board');
}

function pick() {
	if (!isMyTurn()) return alert('Not your turn!');
	$('.hand_card').removeClass('selected');
	$(this).addClass('selected');
}

function play() {
	var selectedIndex = $('.hand_card.selected').index();
	if (selectedIndex === -1)
		return alert('select a card from your hand first');
	var pickIndex = me().state.hand.splice(selectedIndex, 1)[0];
	var position = $(this).index() / 2;
	var correct = isCorrect(pickIndex, position);
	var selector = correct ? '#correct_answer' : '#wrong_answer';
	socket.send({ endpoint: 'showImg', selector: selector });
	state.board.splice(position, 0, pickIndex);
	if (!correct) {
		if (state.deck.length === 0)
			return socket.send({
				endpoint: 'alert',
				alert: 'Uh oh, we ran out of cards!',
			});
		me().state.hand.push(state.deck.shift());
		sortBoard();
	}
	x = this;
	var message =
		'played ' +
		state.terms[pickIndex].word +
		' - ' +
		(correct ? 'CORRECT' : 'WRONG');
	if (correct && me().state.hand.length === 0) {
		state.currentPlayer = -state.currentPlayer;
		message += ' and wins!';
	} else {
		advanceTurn();
	}
	sendState(message);
}

function isCorrect(pickIndex, position) {
	if (position !== 0) {
		if (equal(pickIndex, position - 1)) return true;
		if (pickIndex < state.board[position - 1]) {
			return false;
		}
	}
	if (position !== state.board.length) {
		if (equal(pickIndex, position)) return true;
		if (pickIndex > state.board[position]) {
			return false;
		}
	}
	return true;
}

function equal(index1, index2) {
	return state.terms[index1].definition === state.board[index2].definition;
}

function showImg(data) {
	var selector = data.selector;
	$(selector).animate(
		{ 'margin-right': '-100%' },
		{
			duration: 1200,
			easing: 'linear',
			done: function() {
				$(selector).css('margin-right', '100%');
			},
		}
	);
}

function victory(data) {
	$('#winner').text(state.players[-state.currentPlayer].name);
	show('#game_end');
}

endpoints.showImg = showImg;
