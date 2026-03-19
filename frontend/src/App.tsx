import Dashboard from './components/staff_dashboard/Dashboard';
import WelcomeScreen from './components/customer_tablet/WelcomeScreen';

function App() {
  const isTablet = window.location.pathname === '/tablet';

  if (isTablet) {
    return <WelcomeScreen onLanguageSelect={(code, name) => {
      console.log('Language selected:', code, name);
    }} />;
  }

  return <Dashboard />;
}

export default App;