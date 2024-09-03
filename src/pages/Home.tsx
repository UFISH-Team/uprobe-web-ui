import '../App.css';
import useStore from "../store";

const Home = () => {

  const { setPanel } = useStore()

  return (
    <div className="container" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <img
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.5,
        }}
        src="/uprobe_background.webp" alt="U-Probe background"
      />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '2.5em', color: '#2c3e50' }}>U-Probe: A Universal Probe Design Tool</h1>
        <p style={{ fontSize: '1.2em', color: '#34495e', lineHeight: '1.5' }}>
          Welcome to U-Probe, your universal tool for designing and optimizing probes for various applications, including fluorescence in situ hybridization (FISH).
        </p>

        <div style={{ marginTop: '20px' }}>
          <button style={{ 
            margin: '10px', 
            padding: '15px 30px', // 增加按钮的内边距
            fontSize: '1.5em', // 增加字体大小
            fontWeight: 'bold', // 加粗字体
            color: '#fff', // 字体颜色
            opacity: 1,
            backgroundColor: '#3a7ca5', // 按钮背景颜色
            border: 'none', // 去掉边框
            borderRadius: '5px', // 圆角
            cursor: 'pointer' // 鼠标悬停时显示为手型
          }} onClick={() => { setPanel("design") }}>Start Designing</button>
          <button style={{ 
            margin: '10px', 
            padding: '15px 30px', 
            fontSize: '1.5em', 
            fontWeight: 'bold', 
            color: '#fff', 
            backgroundColor: '#2d168b', 
            opacity: 0.7,
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }} onClick={() => { setPanel("tutorial") }}>View Examples</button>
          <button style={{ 
            margin: '10px', 
            padding: '15px 30px', 
            fontSize: '1.5em', 
            fontWeight: 'bold', 
            color: '#fff', 
            backgroundColor: '#f46f9f', 
            opacity: 0.8,
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }} onClick={() => { setPanel("genome") }}>Upload Data</button>
        </div>
        <p style={{ marginTop: '30px', fontSize: '1.2em', color: '#34495e' }}>
          Create custom probes tailored to your specific research needs with ease!
        </p>
      </div>
    </div>
  );
};

export default Home;