import { createApp } from 'vue';

function App() {
  return createApp({
    setup() {
      return () => <div>Hello World</div>;
    },
  });
}

export default App;
