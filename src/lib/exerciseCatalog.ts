// Comprehensive exercise catalog used for autocomplete suggestions.
// Covers strength, bodyweight, olympic lifts, kettlebell, cardio, mobility, plyometrics, and more.
export const EXERCISE_CATALOG: string[] = [
  // ===== CHEST =====
  "Bench Press", "Incline Bench Press", "Decline Bench Press", "Close-Grip Bench Press",
  "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press",
  "Floor Press", "Dumbbell Floor Press", "Spoto Press", "Larsen Press",
  "Push-up", "Wide Push-up", "Diamond Push-up", "Decline Push-up", "Incline Push-up",
  "Archer Push-up", "Pseudo Planche Push-up", "Planche Push-up", "Hindu Push-up",
  "Clap Push-up", "Spider-Man Push-up", "Pike Push-up", "Knuckle Push-up",
  "Chest Fly", "Dumbbell Fly", "Incline Dumbbell Fly", "Cable Fly", "Cable Crossover",
  "Low-to-High Cable Fly", "High-to-Low Cable Fly", "Pec Deck", "Svend Press",
  "Dips", "Chest Dip", "Ring Dip", "Bench Dip", "Machine Chest Press",
  "Smith Machine Bench Press", "Landmine Press", "Landmine Chest Press",

  // ===== SHOULDERS =====
  "Overhead Press", "Standing Overhead Press", "Seated Overhead Press",
  "Military Press", "Push Press", "Push Jerk", "Split Jerk", "Behind-the-Neck Press",
  "Dumbbell Shoulder Press", "Seated Dumbbell Press", "Arnold Press",
  "Z Press", "Bradford Press", "Single-Arm Dumbbell Press",
  "Lateral Raise", "Dumbbell Lateral Raise", "Cable Lateral Raise", "Machine Lateral Raise",
  "Leaning Lateral Raise", "Front Raise", "Plate Front Raise", "Cable Front Raise",
  "Rear Delt Fly", "Bent-over Rear Delt Fly", "Reverse Pec Deck", "Face Pull",
  "Cable Face Pull", "Band Pull-Apart", "Upright Row", "Cable Upright Row",
  "Shrug", "Dumbbell Shrug", "Barbell Shrug", "Trap Bar Shrug", "Snatch-Grip Shrug",
  "Cuban Press", "Bottoms-Up Press", "Handstand Push-up", "Pike Press",
  "Landmine Shoulder Press", "Half-Kneeling Press", "Bus Driver",

  // ===== BACK =====
  "Pull-up", "Wide-Grip Pull-up", "Neutral-Grip Pull-up", "Chin-up", "Weighted Pull-up",
  "L-Sit Pull-up", "Archer Pull-up", "Muscle-Up", "Ring Muscle-Up", "Bar Muscle-Up",
  "Lat Pulldown", "Wide-Grip Lat Pulldown", "Close-Grip Lat Pulldown", "Reverse-Grip Pulldown",
  "Straight-Arm Pulldown", "Single-Arm Lat Pulldown",
  "Seated Cable Row", "Wide-Grip Cable Row", "Single-Arm Cable Row",
  "Bent-over Row", "Pendlay Row", "Yates Row", "Dumbbell Row", "Single-Arm Dumbbell Row",
  "Chest-Supported Row", "T-Bar Row", "Meadows Row", "Inverted Row", "Ring Row",
  "Helms Row", "Kroc Row", "Landmine Row",
  "Deadlift", "Conventional Deadlift", "Sumo Deadlift", "Romanian Deadlift",
  "Stiff-Leg Deadlift", "Trap Bar Deadlift", "Deficit Deadlift", "Block Pull",
  "Rack Pull", "Snatch-Grip Deadlift", "Single-Leg Romanian Deadlift",
  "Good Morning", "Seated Good Morning", "Hyperextension", "Back Extension",
  "Reverse Hyperextension", "Superman", "Bird Dog",

  // ===== BICEPS =====
  "Barbell Curl", "EZ-Bar Curl", "Dumbbell Curl", "Alternating Dumbbell Curl",
  "Hammer Curl", "Cross-Body Hammer Curl", "Preacher Curl", "Spider Curl",
  "Concentration Curl", "Incline Dumbbell Curl", "Cable Curl", "Rope Hammer Curl",
  "Reverse Curl", "Zottman Curl", "Drag Curl", "21s", "Bayesian Curl",
  "Machine Preacher Curl", "Single-Arm Cable Curl",

  // ===== TRICEPS =====
  "Tricep Pushdown", "Rope Pushdown", "V-Bar Pushdown", "Reverse-Grip Pushdown",
  "Skull Crusher", "EZ-Bar Skull Crusher", "Dumbbell Skull Crusher",
  "Overhead Tricep Extension", "Dumbbell Overhead Extension", "Cable Overhead Extension",
  "Rope Overhead Extension", "Tricep Dip", "Bench Dip", "Tricep Kickback",
  "Cable Kickback", "JM Press", "Tate Press", "Diamond Push-up",
  "Close-Grip Push-up", "Bodyweight Skull Crusher",

  // ===== FOREARMS / GRIP =====
  "Wrist Curl", "Reverse Wrist Curl", "Behind-the-Back Wrist Curl",
  "Farmer's Walk", "Suitcase Carry", "Plate Pinch", "Dead Hang", "Towel Hang",
  "Captains of Crush", "Fat Grip Hold", "Wrist Roller",

  // ===== QUADS =====
  "Squat", "Back Squat", "Front Squat", "Overhead Squat", "Goblet Squat",
  "Box Squat", "Pause Squat", "Tempo Squat", "Anderson Squat", "Zercher Squat",
  "Hack Squat", "Smith Machine Squat", "Belt Squat", "Sissy Squat",
  "Bulgarian Split Squat", "Split Squat", "Lunge", "Walking Lunge", "Reverse Lunge",
  "Lateral Lunge", "Curtsy Lunge", "Step-Up", "Box Step-Up", "Pistol Squat",
  "Shrimp Squat", "Cossack Squat", "Wall Sit", "Spanish Squat",
  "Leg Press", "Single-Leg Press", "Hack Squat Machine", "Leg Extension",
  "Single-Leg Extension", "Reverse Nordic Curl",

  // ===== HAMSTRINGS =====
  "Leg Curl", "Lying Leg Curl", "Seated Leg Curl", "Standing Leg Curl",
  "Nordic Hamstring Curl", "Glute Ham Raise", "Stability Ball Leg Curl",
  "Slider Leg Curl", "Kettlebell Swing",

  // ===== GLUTES =====
  "Hip Thrust", "Barbell Hip Thrust", "Single-Leg Hip Thrust", "B-Stance Hip Thrust",
  "Glute Bridge", "Single-Leg Glute Bridge", "Frog Pump", "Cable Kickback",
  "Glute Kickback", "Donkey Kick", "Fire Hydrant", "Clamshell",
  "Cable Pull-Through", "Banded Lateral Walk", "Banded Monster Walk",
  "Sumo Squat", "Romanian Deadlift", "Kickback Machine",

  // ===== CALVES =====
  "Calf Raise", "Standing Calf Raise", "Seated Calf Raise", "Donkey Calf Raise",
  "Single-Leg Calf Raise", "Smith Machine Calf Raise", "Leg Press Calf Raise",
  "Tibialis Raise",

  // ===== CORE / ABS =====
  "Plank", "Forearm Plank", "Side Plank", "Plank with Shoulder Tap", "RKC Plank",
  "Crunch", "Cable Crunch", "Bicycle Crunch", "Reverse Crunch", "Decline Crunch",
  "Sit-up", "V-Up", "Tuck-up", "Toe Touch", "Russian Twist", "Cable Woodchop",
  "Pallof Press", "Hanging Leg Raise", "Hanging Knee Raise", "Lying Leg Raise",
  "Captain's Chair Leg Raise", "Dragon Flag", "Hollow Hold", "Hollow Rocks",
  "Ab Wheel Rollout", "Barbell Rollout", "Mountain Climber", "Dead Bug",
  "Bird Dog", "L-Sit", "Flutter Kicks", "Scissor Kicks", "Toes-to-Bar",
  "Windshield Wiper", "Side Bend", "Suitcase Hold", "Copenhagen Plank",
  "Hip Dip", "Ab Crunch Machine",

  // ===== OLYMPIC LIFTS =====
  "Snatch", "Power Snatch", "Hang Snatch", "Hang Power Snatch", "Snatch Pull",
  "Snatch High Pull", "Muscle Snatch", "Snatch Balance", "Overhead Squat",
  "Clean", "Power Clean", "Hang Clean", "Hang Power Clean", "Clean Pull",
  "Clean High Pull", "Muscle Clean", "Clean and Jerk", "Clean and Press",
  "Jerk", "Push Jerk", "Split Jerk", "Squat Jerk", "Jerk from Rack",

  // ===== KETTLEBELL =====
  "Kettlebell Swing", "American Kettlebell Swing", "Russian Kettlebell Swing",
  "Single-Arm Kettlebell Swing", "Kettlebell Snatch", "Kettlebell Clean",
  "Kettlebell Clean and Press", "Turkish Get-Up", "Kettlebell Goblet Squat",
  "Kettlebell Front Squat", "Kettlebell Deadlift", "Kettlebell Press",
  "Kettlebell Halo", "Kettlebell Windmill", "Kettlebell Figure 8",

  // ===== PLYOMETRICS / EXPLOSIVE =====
  "Box Jump", "Depth Jump", "Broad Jump", "Standing Long Jump", "Tuck Jump",
  "Squat Jump", "Lunge Jump", "Split Squat Jump", "Lateral Bound", "Skater Jump",
  "Burpee", "Burpee Box Jump", "Burpee Pull-up", "Bear Crawl", "Crab Walk",
  "Mountain Climber", "Plyo Push-up", "Clap Push-up", "Medicine Ball Slam",
  "Medicine Ball Throw", "Medicine Ball Chest Pass", "Wall Ball",
  "Battle Ropes", "Sled Push", "Sled Pull", "Prowler Push", "Tire Flip",

  // ===== CARDIO / CONDITIONING =====
  "Running", "Treadmill Run", "Sprint", "Hill Sprint", "Jogging", "Walking",
  "Incline Walk", "Cycling", "Stationary Bike", "Spin Bike", "Assault Bike",
  "Rowing", "Rower", "Concept2 Row", "SkiErg", "Elliptical", "Stair Climber",
  "StairMaster", "Jump Rope", "Double-Unders", "Single-Unders", "High Knees",
  "Butt Kicks", "Jumping Jacks", "Star Jumps", "Shadow Boxing", "Heavy Bag",
  "Speed Bag", "Swimming", "Freestyle Swim", "Backstroke", "Breaststroke",
  "Butterfly Stroke", "Hiking", "Stair Run",

  // ===== STRONGMAN =====
  "Atlas Stone Lift", "Log Press", "Axle Press", "Yoke Walk", "Farmer's Carry",
  "Sandbag Carry", "Sandbag Clean", "Keg Toss", "Tire Flip", "Sled Drag",
  "Truck Pull", "Husafell Carry",

  // ===== MOBILITY / STRETCHING =====
  "Cat-Cow", "Child's Pose", "Downward Dog", "Cobra Stretch", "Pigeon Pose",
  "Hip Flexor Stretch", "Couch Stretch", "90/90 Stretch", "Thread the Needle",
  "World's Greatest Stretch", "Hamstring Stretch", "Quad Stretch", "Calf Stretch",
  "Shoulder Dislocate", "Wall Slide", "Doorway Stretch", "Foam Rolling",
  "Lacrosse Ball Release", "Banded Distraction",

  // ===== GYMNASTICS / CALISTHENICS =====
  "Handstand", "Handstand Hold", "Handstand Walk", "Wall Walk", "Crow Pose",
  "Front Lever", "Back Lever", "Planche", "Tuck Planche", "Human Flag",
  "Skin the Cat", "Pelican Curl", "Ring Support Hold", "Iron Cross",
  "Maltese", "Manna", "L-Sit", "V-Sit",

  // ===== OTHER =====
  "Sled Push", "Sled Pull", "Battle Ropes", "Rope Climb", "Peg Board",
  "Sandbag Squat", "Sandbag Clean", "Stone Over Bar",
];
