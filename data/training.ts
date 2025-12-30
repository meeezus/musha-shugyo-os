import { TrainingSession } from "../types";

export const SESSIONS: Record<number, Record<number, TrainingSession>> = {
    // --- BLOCK 1 ---
    1: {
      1: {
          title: "Block 1: Anabolic I",
          focus: "Strength & Power",
          duration: "60m",
          warmup: ["Jump Rope Flow (3-5 min)", "90/90 Hip Transitions (1x4/side)", "Kettlebell Arm Bar (1x8/side)", "Deep Tier Squat Jumps (1x20)"],
          clusters: [
              { title: "Cluster A", rest: "2-3 min", exercises: [
                  { id: "a_zercher", name: "Zercher Box Squat", sets: "3", reps: "4-6", intensity: "80-85%", notes: "Explosive intent" },
                  { id: "a_boxjump", name: "Standing Box Jump", sets: "3", reps: "5", intensity: "BW", notes: "Max height" },
                  { id: "a_pogo", name: "Double Leg Forward POGOs", sets: "3", reps: "15", intensity: "BW", notes: "10 each direction" }
              ]},
              { title: "Cluster B", rest: "90 sec", exercises: [
                  { id: "a_chinup", name: "Strict Chin Up", sets: "3", reps: "6-9", notes: "Add weight if easy" },
                  { id: "a_slrdl", name: "Single Leg Posted RDL", sets: "3", reps: "12", notes: "Control the hinge" }
              ]},
              { title: "Cluster C", rest: "60 sec", exercises: [
                  { id: "a_latlunge", name: "Lateral Lunge to Plate Press", sets: "2", reps: "8", notes: "Both sides" },
                  { id: "a_dbrot", name: "DB Int/Ext Rotations", sets: "2", reps: "15-20", notes: "Rotator health" },
                  { id: "a_wrist", name: "Wrist Turnovers", sets: "2", reps: "10", notes: "Forearm pump" }
              ]},
              { title: "Finisher", exercises: [
                  { id: "a_farmers", name: "Farmers Carry", sets: "1", reps: "20m", notes: "Heavy" },
                  { id: "a_kbrack", name: "KB Rack Carry", sets: "1", reps: "20m", notes: "Core braced" },
                  { id: "a_waiters", name: "Waiters Carry", sets: "1", reps: "20m", notes: "Overhead stability" }
              ]}
          ]
      },
      2: {
          title: "Block 1: Anabolic II",
          focus: "Force & Hypertrophy",
          duration: "60m",
          warmup: ["Jump Rope Flow", "90/90 Hip Transitions", "Kettlebell Arm Bar", "Deep Tier Squat Jumps"],
          clusters: [
              { title: "Cluster A", rest: "2-3 min", exercises: [
                  { id: "a_incrow", name: "Incline DB Row", sets: "3", reps: "8", intensity: "Heavy", notes: "Chest supported" },
                  { id: "a_plyopush", name: "Bench Plyometric Push Up", sets: "3", reps: "20", intensity: "BW", notes: "Explosive" },
                  { id: "a_ballsq", name: "Med Ball Squeeze Isometric", sets: "3", reps: "30s", notes: "Max effort squeeze" }
              ]},
              { title: "Cluster B", rest: "90 sec", exercises: [
                  { id: "a_floorpress", name: "Barbell Floor Press", sets: "3", reps: "6-9", notes: "Dead stop at bottom" },
                  { id: "a_facepull", name: "Seated Facepull", sets: "3", reps: "12", notes: "Retract scapula" }
              ]},
              { title: "Cluster C", rest: "60 sec", exercises: [
                  { id: "a_sideplank", name: "Side Plank Bench Pump", sets: "2", reps: "8", notes: "Per side" },
                  { id: "a_calf", name: "Seated Calf Raises", sets: "2", reps: "15", notes: "Full ROM" },
                  { id: "a_tibial", name: "Kettlebell Tibial Raises", sets: "2", reps: "10", notes: "Shin health" }
              ]},
              { title: "Finisher", exercises: [
                  { id: "a_sledpush", name: "Sled Push", sets: "1", reps: "20m", notes: "Max effort" },
                  { id: "a_sleddrag", name: "Sled Drag", sets: "1", reps: "20m", notes: "Lean back" },
                  { id: "a_latsled", name: "Lateral Sled Drag", sets: "1", reps: "20m", notes: "Each side" }
              ]}
          ]
      },
      3: {
          title: "Block 1: Anabolic III",
          focus: "Hypertrophy & Durability",
          duration: "60m",
          warmup: ["Jump Rope Flow", "90/90 Hip Transitions", "Kettlebell Arm Bar", "Deep Tier Squat Jumps"],
          clusters: [
              { title: "Cluster A", rest: "2-3 min", exercises: [
                  { id: "a_dbrdl", name: "Dumbbell RDL", sets: "3", reps: "6-9", intensity: "70-80%", notes: "Hamstring tension" },
                  { id: "a_kbswing", name: "Banded Kettlebell Swings", sets: "3", reps: "8", intensity: "20-30% BW", notes: "Explosive hip snap" },
                  { id: "a_latjump", name: "Double Leg Lateral Jumps", sets: "3", reps: "10", notes: "Stick the landing" }
              ]},
              { title: "Cluster B", rest: "90 sec", exercises: [
                  { id: "a_bulgarian", name: "Bulgarian Split Squat", sets: "3", reps: "8", notes: "Both sides" },
                  { id: "a_1armbench", name: "Single Arm DB Bench Press", sets: "3", reps: "10", notes: "Anti-rotation core" }
              ]},
              { title: "Cluster C", rest: "60 sec", exercises: [
                  { id: "a_inclat", name: "Incline DB Lateral Raise", sets: "2", reps: "15-20", notes: "Strict form" },
                  { id: "a_hammer", name: "Dumbbell Hammer Curl", sets: "2", reps: "12-15", notes: "Bicep/Forearm" },
                  { id: "a_tricep", name: "Tricep Rope Pushdowns", sets: "3", reps: "12-15", notes: "Lockout" }
              ]},
              { title: "Finisher", exercises: [
                  { id: "a_farmers2", name: "Farmers Carry", sets: "1", reps: "30m", notes: "Heavy" },
                  { id: "a_suit2", name: "Suitcase Carry", sets: "1", reps: "30m", notes: "No leaning" },
                  { id: "a_zerch2", name: "Zercher Carry", sets: "1", reps: "30m", notes: "High elbows" }
              ]}
          ]
      }
    }
};
