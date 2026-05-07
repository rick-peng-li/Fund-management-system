import React, { useRef, useState, useMemo } from 'react';

interface Transaction {
  id: string;
  time: string;
  type: string;
  amount: string;
  party: string;
  status: 'success' | 'pending' | 'failed';
  rawDate: Date; // Helper for sorting/filtering
}

// 模拟数据生成函数
const generateMockData = (): Transaction[] => {
  const types = ['充值', '提现', '转账', '投资'];
  const parties = ['支付宝', '微信支付', '建设银行', '工商银行', '张三', '李四', '基金A', '理财B'];
  const statuses: ('success' | 'pending' | 'failed')[] = ['success', 'pending', 'failed'];
  const data: Transaction[] = [];
  const now = new Date();

  const pushItem = (index: number, date: Date) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const isIncome = type === '充值' || (type === '转账' && Math.random() > 0.5);
    const amountVal = (Math.random() * 10000).toFixed(2);
    const amount = isIncome ? `+${amountVal}` : `-${amountVal}`;
    data.push({
      id: `TXN${10000 + index}`,
      time: date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      type,
      amount,
      party: parties[Math.floor(Math.random() * parties.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      rawDate: date,
    });
  };

  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 7));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    pushItem(i, d);
  }
  for (let i = 30; i < 40; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (7 + Math.floor(Math.random() * 23)));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    pushItem(i, d);
  }
  for (let i = 40; i < 50; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (30 + Math.floor(Math.random() * 60)));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    pushItem(i, d);
  }

  return data.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
};

const IndexPage: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('week');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('week');
  const [searchValue, setSearchValue] = useState<string>('');
  const messageTimerRef = useRef<number | null>(null);

  // 初始化数据
  const [allTransactions] = useState<Transaction[]>(generateMockData());
  const isPc = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

  const showMessageAll = (msg: string) => {
    setMessage(msg);
    setShowMessage(true);
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };

  const showMessagePcOnly = (msg: string) => {
    const isPcNow = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    if (!isPcNow) return;
    showMessageAll(msg);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    showMessageAll('选择时间图表功能在这里实现');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    showMessagePcOnly('分页功能在这里实现');
    // 滚动到表格顶部
    const table = document.querySelector('.transaction-records');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterType(value);
    setCurrentPage(1); // 重置页码
    if (value !== 'all') {
      showMessageAll('筛选类型功能在这里实现');
    }
  };

  const handleFilterStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterStatus(value);
    setCurrentPage(1);
    if (value !== 'all') {
      showMessageAll('筛选状态功能在这里实现');
    }
  };

  const handleFilterTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterTime(value);
    setCurrentPage(1);
    if (value !== 'week') {
      showMessagePcOnly('筛选时间功能在这里实现');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      showMessageAll(`搜索: ${searchValue}`);
    }
  };

  // 过滤数据逻辑
  const filteredTransactions = useMemo(() => {
    const effectiveFilterTime = isPc ? 'week' : filterTime;
    return allTransactions.filter(t => {
      // 时间过滤 (列表筛选)
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - t.rawDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (effectiveFilterTime === 'week' && diffDays > 7) return false;
      if (effectiveFilterTime === 'month' && diffDays > 30) return false;
      if (effectiveFilterTime === 'quarter' && diffDays > 90) return false;

      return true;
    });
  }, [allTransactions, filterTime, isPc]);

  // 分页逻辑
  const totalPagesMap: Record<string, number> = { week: 3, month: 4, quarter: 5 };
  const totalPages = isPc ? 3 : (totalPagesMap[filterTime] ?? 3);
  const pageSize = 10;
  const requiredCount = totalPages * pageSize;
  const visibleTransactions = filteredTransactions.slice(0, requiredCount);
  const dataPage = isPc ? 1 : currentPage;
  const currentData = visibleTransactions.slice((dataPage - 1) * pageSize, dataPage * pageSize);

  const getStatusClass = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'status-success bg-green-100 text-green-700';
      case 'pending':
        return 'status-pending bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'status-failed bg-red-100 text-red-700';
      default:
        return '';
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'pending':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  return (
    <div className="container min-h-screen bg-[#f5f7fa] text-[#333] font-sans pb-10 mx-auto">
      {showMessage && (
        <div
          id="message"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300"
        >
          {message}
        </div>
      )}

      <header className="header flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="logo text-[24px] font-bold text-[#2c3e50]">
          资金管理系统
        </div>
        <div className="user-info flex items-center">
          <div className="user-avatar w-10 h-10 rounded-full bg-[#3498db] text-white flex items-center justify-center font-bold text-lg">
            U
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        <section className="account-overview grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="card bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="card-header mb-3 sm:mb-4">
              <h3 className="card-title text-lg font-medium text-gray-600">总资产</h3>
            </div>
            <div className="amount text-[26px] sm:text-[28px] font-bold text-[#2c3e50] mb-2">
              ¥128,500.00
            </div>
            <div className="amount-details text-[13px] sm:text-[14px] text-gray-500 mb-5 sm:mb-6">
              较上月 +5.2%
            </div>
            <div className="actions flex space-x-3">
              <button
                className="btn btn-primary flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                onClick={() => showMessageAll('充值功能在这里实现')}
              >
                充值
              </button>
              <button
                className="btn btn-outline flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-4 rounded transition-colors"
                onClick={() => showMessageAll('提现功能在这里实现')}
              >
                提现
              </button>
            </div>
          </div>

          <div className="card bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="card-header mb-3 sm:mb-4">
              <h3 className="card-title text-lg font-medium text-gray-600">可用余额</h3>
            </div>
            <div className="amount text-[26px] sm:text-[28px] font-bold text-[#2c3e50] mb-2">
              ¥45,200.00
            </div>
            <div className="amount-details text-[13px] sm:text-[14px] text-gray-500 mb-5 sm:mb-6">
              随时可提现
            </div>
            <div className="actions flex space-x-3">
              <button
                className="btn btn-primary flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                onClick={() => showMessageAll('转账功能在这里实现')}
              >
                转账
              </button>
              <button
                className="btn btn-outline flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-4 rounded transition-colors"
                onClick={() => showMessageAll('投资功能在这里实现')}
              >
                投资
              </button>
            </div>
          </div>

          <div className="card bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="card-header mb-3 sm:mb-4">
              <h3 className="card-title text-lg font-medium text-gray-600">冻结资金</h3>
            </div>
            <div className="amount text-[26px] sm:text-[28px] font-bold text-[#2c3e50] mb-2">
              ¥83,300.00
            </div>
            <div className="amount-details text-[13px] sm:text-[14px] text-gray-500 mb-5 sm:mb-6">
              投资中 + 审核中
            </div>
            <div className="actions flex">
              <button
                className="btn btn-outline w-full border border-gray-400 text-gray-600 hover:bg-gray-50 py-2 px-4 rounded transition-colors"
                onClick={() => showMessageAll('查看详情功能在这里实现')}
              >
                查看详情
              </button>
            </div>
          </div>
        </section>

        <section className="chart-container bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="chart-header flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
            <h3 className="chart-title text-lg font-bold text-[#2c3e50] mb-3 sm:mb-0">资产走势</h3>
            <div className="chart-tabs flex space-x-2 bg-gray-100 p-1 rounded-md overflow-x-auto sm:overflow-visible whitespace-nowrap">
              {['week', 'month', 'quarter', 'year'].map((tab) => {
                const labels: Record<string, string> = {
                  week: '一周',
                  month: '一月',
                  quarter: '三月',
                  year: '一年',
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    className={`chart-tab px-4 py-1.5 text-sm rounded-md transition-colors ${
                      activeTab === tab
                        ? 'active bg-white text-blue-600 shadow-sm font-medium ring-1 ring-blue-100'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="chart h-[200px] md:h-[300px] bg-gray-50 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center relative transition-all duration-300">
             <div className="text-gray-400 font-medium mb-2">
               {activeTab === 'week' && '本周资产波动图表'}
               {activeTab === 'month' && '本月资产波动图表'}
               {activeTab === 'quarter' && '本季度资产波动图表'}
               {activeTab === 'year' && '本年度资产波动图表'}
             </div>
             <div className="text-sm text-gray-400">(图表数据加载中...)</div>
          </div>
        </section>

        <section className="transaction-records bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="section-title text-xl font-bold text-[#2c3e50] mb-6 border-l-4 border-blue-600 pl-3">
            交易记录
          </h3>

          <div className="filter-bar flex flex-nowrap overflow-x-auto gap-3 pb-2 mb-6 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:gap-4">
            <div className="filter-group flex flex-nowrap gap-3 md:grid md:grid-cols-3 md:gap-4 md:col-span-3">
              <div className="select-wrapper min-w-[120px] md:min-w-0 relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                  value={filterType}
                  onChange={handleFilterTypeChange}
                >
                  <option value="all">全部类型</option>
                  <option value="recharge">充值</option>
                  <option value="withdraw">提现</option>
                  <option value="transfer">转账</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="select-wrapper min-w-[120px] md:min-w-0 relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                  value={filterStatus}
                  onChange={handleFilterStatusChange}
                >
                  <option value="all">全部状态</option>
                  <option value="success">成功</option>
                  <option value="pending">处理中</option>
                  <option value="failed">失败</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="select-wrapper min-w-[120px] md:min-w-0 relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                  value={filterTime}
                  onChange={handleFilterTimeChange}
                >
                  <option value="week">最近一周</option>
                  <option value="month">最近一月</option>
                  <option value="quarter">最近三月</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div className="search-box min-w-[160px] md:min-w-0 md:col-span-1 md:w-full">
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="搜索交易..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易编号
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    交易类型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易金额
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易方
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.length > 0 ? (
                  currentData.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap truncate text-sm text-gray-900">
                        {transaction.type}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.party}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:text-blue-800 hover:underline" onClick={() => showMessageAll('详情功能在这里实现')}>
                        详情
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      暂无符合条件的交易记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <div className="pagination flex justify-center items-center mt-8 space-x-2 overflow-x-auto py-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <span
                  key={pageNum}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${
                    currentPage === pageNum
                      ? 'active bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </span>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default IndexPage;
