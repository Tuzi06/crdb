const { useState, useEffect } = React;
const {mongoose} = mongoose;

// 后端 API 地址
const API_URL = 'https://crbd-backend.vercel.app/api/companies';

const allIndustries = ["全部", "互联网", "金融", "物流", "教育", "设计", "制造", "其他"];

function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true); // 新增加载状态
  const [filterIndustry, setFilterIndustry] = useState("全部");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const [formData, setFormData] = useState({
      name: '', industry: '互联网', type: 'red', rating: 5, tags: '', comment: ''
  });

  // 1. 从后端获取数据
  const fetchCompanies = async () => {
      try {
          setLoading(true);
          // 根据当前筛选的行业构建 URL 参数
          const url = filterIndustry === "全部" 
              ? API_URL 
              : `${API_URL}?industry=${filterIndustry}`;
          
          const response = await fetch(url);
          const data = await response.json();
          setCompanies(data);
      } catch (error) {
          console.error("获取数据失败:", error);
          setToast({ show: true, message: "连接服务器失败", isSuccess: false });
      } finally {
          setLoading(false);
      }
  };

  // 初始化加载和筛选变化时重新获取
  useEffect(() => {
      fetchCompanies();
  }, [filterIndustry]);

  const toggleModal = () => {
      setIsModalOpen(!isModalOpen);
      if (!isModalOpen) {
          setFormData({ name: '', industry: '互联网', type: 'red', rating: 5, tags: '', comment: '' });
      }
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. 提交数据到后端
  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.name || !formData.comment) return;

      const payload = {
          ...formData,
          tags: formData.tags.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag),
          rating: parseFloat(formData.rating)
      };

      try {
          const response = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (response.ok) {
              const newCompany = await response.json();
              // 成功后，将新数据加到列表最前面，避免重新请求整个列表（优化体验）
              setCompanies([newCompany, ...companies]);
              toggleModal();
              setToast({ show: true, message: "发布成功！", isSuccess: true });
          } else {
              throw new Error("提交失败");
          }
      } catch (error) {
          console.error(error);
          setToast({ show: true, message: "发布失败，请重试", isSuccess: false });
      }
  };

  const showToast = (message, isSuccess = true) => {
      setToast({ show: true, message, isSuccess });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const redList = companies.filter(c => c.type === 'red');
  const blackList = companies.filter(c => c.type === 'black');

  return (
      <div>
          <Header 
              filterIndustry={filterIndustry} 
              onFilterChange={(e) => setFilterIndustry(e.target.value)}
              onAddClick={toggleModal}
          />
          <main>
              {loading ? (
                  <div style={{textAlign: 'center', padding: '2rem'}}>加载中...</div>
              ) : (
                  <>
                      <Section title="红榜 (推荐)" type="red" data={redList} icon="fa-heart" />
                      <Section title="黑榜 (避雷)" type="black" data={blackList} icon="fa-skull" />
                  </>
              )}
          </main>
          <Modal isOpen={isModalOpen} onClose={toggleModal} formData={formData} onChange={handleInputChange} onSubmit={handleSubmit} />
          <div className={`toast ${toast.show ? 'show' : ''}`} style={{ backgroundColor: toast.isSuccess ? '#10b981' : '#ef4444' }}>
              {toast.message}
          </div>
      </div>
  );
}

export default App;
