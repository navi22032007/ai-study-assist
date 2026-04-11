import socketio

# Create a Socket.IO server instance
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Keep track of rooms and their states
# In a production app, use Redis for this
room_states = {}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Remove from any rooms
    empty_rooms = []
    for room_id, state in room_states.items():
        if sid in state.get('participants', []):
            state['participants'].remove(sid)
            if 'participants_data' in state and sid in state['participants_data']:
                del state['participants_data'][sid]
            
            participants_list = list(state.get('participants_data', {}).values())
            await sio.emit('participants_update', participants_list, room=room_id)
            
            if not state['participants']:
                empty_rooms.append(room_id)
                
    for r in empty_rooms:
        del room_states[r]

@sio.event
async def join_room(sid, data):
    room_id = data.get('room_id')
    user_name = data.get('user_name', 'Student')
    document_id = data.get('document_id')
    
    if not room_id:
        return {'error': 'No room ID provided'}

    # Initialize room state if it doesn't exist
    if room_id not in room_states:
        room_states[room_id] = {
            'mode': 'mindmap', # modes: mindmap, quiz, discussion
            'participants': [],
            'host': sid,
            'document_id': document_id,
            'state': {}
        }
    
    # Add user to room
    sio.enter_room(sid, room_id)
    
    participant = {
        'id': sid,
        'name': user_name,
        'isHost': room_states[room_id]['host'] == sid,
        'score': 0
    }
    
    # Store participant
    if 'participants_data' not in room_states[room_id]:
        room_states[room_id]['participants_data'] = {}
        
    room_states[room_id]['participants_data'][sid] = participant
    if sid not in room_states[room_id]['participants']:
        room_states[room_id]['participants'].append(sid)

    # Send current state to joining user
    await sio.emit('room_state', {
        'mode': room_states[room_id]['mode'],
        'state': room_states[room_id]['state'],
        'document_id': room_states[room_id]['document_id'],
        'isHost': room_states[room_id]['host'] == sid
    }, to=sid)

    # Broadcast updated participants
    participants_list = list(room_states[room_id]['participants_data'].values())
    await sio.emit('participants_update', participants_list, room=room_id)

@sio.event
async def change_mode(sid, data):
    room_id = data.get('room_id')
    mode = data.get('mode')
    
    if room_id in room_states and room_states[room_id]['host'] == sid:
        room_states[room_id]['mode'] = mode
        # Reset mode specific state
        room_states[room_id]['state'] = {}
        await sio.emit('mode_changed', mode, room=room_id)

# --- MINDMAP MODE ---
@sio.event
async def sync_mindmap(sid, data):
    room_id = data.get('room_id')
    nodes = data.get('nodes')
    edges = data.get('edges')
    
    if room_id in room_states and room_states[room_id]['host'] == sid:
        # Only host can expand mind map
        room_states[room_id]['state'] = {'nodes': nodes, 'edges': edges}
        # Emit to everyone else in the room
        await sio.emit('mindmap_updated', {'nodes': nodes, 'edges': edges}, room=room_id, skip_sid=sid)

# --- QUIZ BATTLE MODE ---
@sio.event
async def quiz_question(sid, data):
    room_id = data.get('room_id')
    question = data.get('question')
    
    if room_id in room_states and room_states[room_id]['host'] == sid:
        room_states[room_id]['state']['current_question'] = question
        room_states[room_id]['state']['answers'] = {}
        await sio.emit('new_question', question, room=room_id)

@sio.event
async def submit_answer(sid, data):
    room_id = data.get('room_id')
    answer = data.get('answer')
    is_correct = data.get('is_correct')
    
    if room_id in room_states:
        if 'answers' not in room_states[room_id]['state']:
            room_states[room_id]['state']['answers'] = {}
            
        room_states[room_id]['state']['answers'][sid] = answer
        
        if is_correct:
            if 'participants_data' in room_states[room_id] and sid in room_states[room_id]['participants_data']:
                room_states[room_id]['participants_data'][sid]['score'] += 10
                
        # Send updated leaderboard
        participants_list = list(room_states[room_id]['participants_data'].values())
        participants_list.sort(key=lambda x: x['score'], reverse=True)
        await sio.emit('leaderboard_update', participants_list, room=room_id)

# --- DISCUSSION MODE ---
@sio.event
async def send_chat(sid, data):
    room_id = data.get('room_id')
    message = data.get('message')
    anchor = data.get('anchor') # e.g. "page 2, paragraph 1"
    
    if room_id in room_states:
        sender = room_states[room_id]['participants_data'].get(sid, {}).get('name', 'Unknown')
        chat_msg = {
            'sender': sender,
            'message': message,
            'anchor': anchor,
            'sid': sid
        }
        await sio.emit('chat_received', chat_msg, room=room_id)

socket_app = socketio.ASGIApp(sio)
