from flask import Flask, request,json

app = Flask(__name__)

# Load workout data
with open('workout-data.json', 'r') as f:
    workout_data = json.load(f)

# Load workout attributes
with open('workout-attributes.json', 'r') as f:
    workout_attributes = json.load(f)

@app.route('/')
def home():
    response = app.response_class(
        response=json.dumps({
            'message': "Muscle Wiki API"
        }),
        mimetype='application/json',
        status=200
    )
    return response

@app.route('/exercises')
def get_exercises():
    # Get query parameters
    muscle = request.args.get('muscle')
    name = request.args.get('name')
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    force = request.args.get('force')
    
    # Filter exercises based on query parameters
    filtered_exercises = []
    for exercise in workout_data:
        
        # Filter by muscle: Check if any of the target lists contains the muscle
        if muscle and not any(muscle.lower() in t.lower() for t in exercise.get('target', {}).values() if isinstance(t, list)):
            continue
        
        # Filter by name
        if name and name.lower() not in exercise.get('exercise_name', '').lower():
            continue
        
        # Filter by category
        if category and category.lower() != exercise.get('Category', '').lower():
            continue
        
        # Filter by difficulty (using .get to avoid KeyError)
        if difficulty and difficulty.lower() != exercise.get('Difficulty', '').lower():
            continue
        
        # Filter by force (using .get to avoid KeyError)
        if force and force.lower() != exercise.get('Force', '').lower():
            continue

        filtered_exercises.append(exercise)

    response = app.response_class(
        response=json.dumps(filtered_exercises),
        mimetype='application/json',
        status=200
    )
    return response


@app.route('/exercises/attributes')
def get_exercise_attributes():
    response = app.response_class(
        response=json.dumps(workout_attributes),
        mimetype='application/json',
        status=200
    )
    return response

@app.route('/exercises/<int:exercise_id>')
def get_exercise_by_id(exercise_id):
    # Find exercise by ID
    for exercise in workout_data:
        if exercise['id'] == exercise_id:
            response = app.response_class(
                        response=json.dumps(exercise),
                        mimetype='application/json',
                        status=200
                    )
            return response
    return json.dumps({'error': 'Exercise not found'})

if __name__ == '__main__':
    app.run(debug=True)
