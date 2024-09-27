import { API_KEY } from './config.js';

new Vue({
    el: '#app',
    data: {
        topic: '',
        duration: '',
        age: '',
        englishLevel: 'low',
        lessonPlan: [

            [
                "Energizer",
                "Color Scavenger Hunt - call out a color, and students race to find an object in the room that matches that color.",
                5
            ],
            [
                "Learn",
                "Introduce the phrase - What color is this? It is ...",
                5
            ],
            [
                "Video",
                "Watch a short video clip from 'Rainbow Colors' that introduces primary and secondary colors.",
                5
            ],
            [
                "Learn",
                "Teach the phrases - I like the color... and My favorite color is...",
                5
            ],
            [
                "Activity",
                "Provide coloring sheets with various objects (like a rainbow, fruits, etc.), and let students color them using their favorite colors while saying the names of the colors.",
                10
            ],
            [
                "Game",
                "Play 'Color Bingo' where students have bingo cards with different colors, and call out colors for them to place counters on.",
                10
            ]
        ],
        isLoading: false
    },
    mounted() {
        this.initSortable();
    },
    methods: {
        async generateLessonPlan() {
            this.isLoading = true;
            const prompt = `I'm doing a ${this.duration} minute lesson plan. I am teaching english as a second language to kids who are ${this.age} years old, who have a english level of ${this.englishLevel}. I want to generate a lesson about ${this.topic}. I want the format to be an energizer first (does not have to be related to the lesson). The rest I want it to be filled with any of the following options, in any order that might make sense. 1) Learn - introducing conversational phrases related to the lesson topic. 2) Video - watching a short video related to the lesson topic 3) Game - playing a game that reinforces the conversational phrase 4) Activity - doing an activity related to reinforcing the lesson. Here is an example of the output format I want with an example lesson plan about the word where. The format is [Activity type, description, estimated time]: ["Energizer","Simon Says - you say commands like touch your head, and if you don't say simon says in front of it, the kids that do it are out",5], ["Learn","Introduce the phrase - where is the pencil/eraser/chair/etc - It is over there",5], ["Video", "Watch the opening of scooby doo, where are you to teach the phrase where are you",5],  ["Learn","Introduce the phrase - where are you and where is the classroom/bedroom/library/bathroom",5], ["Activity","split the students into 4 groups, and have each group decorate a sign of their assigned room",10], ["Game","using the signs made in the previous activity, place them around the room face down. students are then randomly assigned a room they need to go to. There are a few students designated as direction givers, and other students need to ask them in english - where is the x room?, and they will respond in english", 10]. Respond only with the array and nothing else.`;
            console.log(prompt);

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    console.log(response);
                    throw new Error('API request failed');
                }

                const data = await response.json();
                this.lessonPlan = JSON.parse(data.choices[0].message.content);
                console.log(this.lessonPlan);
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to generate lesson plan. Please try again.');
            } finally {
                this.isLoading = false;
            }
        },
        initSortable() {
            const el = document.getElementById('sortable-list');
            Sortable.create(el, {
                animation: 150,
                ghostClass: 'sortable-ghost'
            });
        }
    }
});