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
        isLoading: false,
        suggestedTopics: [],
        excludedTopics: [],
        activeTab: 'generate',
        recentLessons: [],
        selectedLesson: null
    },
    mounted() {
        this.initSortable();
        this.loadRecentLessons();
    },
    methods: {
        async generateLessonPlan() {
            this.isLoading = true;

            try {
                const response = await fetch('/api/generate-lesson-plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topic: this.topic,
                        duration: this.duration,
                        age: this.age,
                        englishLevel: this.englishLevel
                    })
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const data = await response.json();
                this.lessonPlan = data.lessonPlan;
                console.log(this.lessonPlan);
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to generate lesson plan. Please try again.');
            } finally {
                this.isLoading = false;
            }
        },
        async loadRecentLessons() {
            try {
                const response = await fetch('/api/recent-lessons');
                if (!response.ok) {
                    throw new Error('Failed to fetch recent lessons');
                }
                this.recentLessons = await response.json();
            } catch (error) {
                console.error('Error loading recent lessons:', error);
            }
        },
        openLessonPopup(lesson) {
            this.selectedLesson = lesson;
        },
        formatDate(timestamp) {
            return new Date(timestamp).toLocaleString();
        },
        formatLessonContent(content) {
            const lessonPlan = JSON.parse(content);
            return lessonPlan.map(item => `
                <div class="lesson-block ${item[0].toLowerCase()}">
                    <h3>${item[0]}</h3>
                    <p>${item[1]}</p>
                    <span class="time">${item[2]} min</span>
                </div>
            `).join('');
        },
        initSortable() {
            const el = document.getElementById('sortable-list');
            Sortable.create(el, {
                animation: 150,
                ghostClass: 'sortable-ghost'
            });
        },
        async generateTopics() {
            try {
                const response = await fetch('/api/generate-topics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        excludedTopics: this.excludedTopics
                    })
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const topics = await response.json();
                this.suggestedTopics = topics;
                this.excludedTopics = [...this.excludedTopics, ...topics];
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to generate topics. Please try again.');
            }
        },
        async regenerateBlock(index) {
            this.isLoading = true;
            try {
                const response = await fetch('/api/regenerate-block', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topic: this.topic,
                        currentBlock: this.lessonPlan[index],
                        lessonPlan: this.lessonPlan,
                        englishLevel: this.englishLevel,
                        age: this.age
                    })
                });
        
                if (!response.ok) {
                    throw new Error('API request failed');
                }
        
                const newBlock = await response.json();
                this.$set(this.lessonPlan, index, newBlock);
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to regenerate block. Please try again.');
            } finally {
                this.isLoading = false;
            }
        },
        selectTopic(topic) {
            this.topic = topic;
        }
    }
});