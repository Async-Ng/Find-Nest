import React, { useState, useEffect } from 'react';
import { Card, Badge, Spin, Empty, Tabs, Tag, Timeline, Modal, Button, Input, message } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  BugOutlined,
  BulbOutlined,
  MessageOutlined,
  HomeOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { adminApi } from '../../../services/api'; // import adminApi
import AdminLayout from '../../../components/adminAuthComponent/AdminLayout'
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


const RequestListPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // số lượng request mỗi lần fetch
  const MySwal = withReactContent(Swal);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);


  useEffect(() => {
    loadRequests();
    loadUsers();
  }, [activeTab, page]);

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers(1, 1000, '', ''); // lấy tối đa 1000 user
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách user:", error);
    }
  };


  const handleViewUserDetail = async (userId) => {
    try {
      const res = await adminApi.getUserDetail(userId);
      if (res.success) {
        setSelectedUser(res.user || null);
        setUserModalVisible(true);
      } else {
        Swal.fire('Lỗi', res.message || 'Không thể tải thông tin người dùng.', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi hệ thống', 'Không thể tải thông tin người dùng.', 'error');
    }
  };
  const loadRequests = async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === 'all' ? '' : activeTab;
      const data = await adminApi.getRequests(page, limit, statusParam);

      if (data.success) {
        setRequests(data.requests || []);
      } else {
        message.error(data.message || 'Không thể tải danh sách yêu cầu');
      }
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra khi tải yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type) => {
    const configs = {
      LANDLORD_REQUEST: { label: 'Yêu cầu nâng cấp quyền chủ trọ', icon: <HomeOutlined />, color: 'blue' },
      FEEDBACK: { label: 'Góp ý', icon: <MessageOutlined />, color: 'green' },
      BUG_REPORT: { label: 'Báo lỗi', icon: <BugOutlined />, color: 'red' },
      FEATURE_REQUEST: { label: 'Đề xuất tính năng', icon: <BulbOutlined />, color: 'purple' },
      GENERAL: { label: 'Chung', icon: <FileTextOutlined />, color: 'default' }
    };
    return configs[type] || configs.GENERAL;
  };

  const handleEditStatus = async (request) => {
    // Bước 1: Hiển thị Swal với input cho adminResponse
    const { value: formValues } = await MySwal.fire({
      title: 'Phê duyệt yêu cầu',
      html: `
      <div style="text-align: left; width: 100%; max-width: 700px; margin: auto;">
        <label style="font-weight: 600; display: block; margin-bottom: 5px;">Trạng thái:</label>
        <input id="swal-status"
               class="swal2-input"
               value="APPROVED"
               disabled
               style="background: #f5f5f5; color: #555; width: 95%; margin-bottom: 10px;" />
        <label style="font-weight: 600; display: block; margin-top: 15px; margin-bottom: 5px;">Nội dung phản hồi:</label>
        <textarea id="swal-response"
                  class="swal2-textarea"
                  placeholder="Nhập nội dung phản hồi..."
                  style="height: 120px; width: 95%; resize: vertical;">Yêu cầu đã được phê duyệt. Quyền Chủ Trọ đã được cấp.</textarea>
      </div>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Xác nhận phê duyệt',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
      preConfirm: () => {
        const adminResponse = document.getElementById('swal-response').value.trim();
        if (!adminResponse) {
          Swal.showValidationMessage('Vui lòng nhập nội dung phản hồi.');
          return false;
        }
        return { adminResponse };
      },
    });

    if (!formValues) return; // người dùng bấm Hủy

    // Bước 2: Gửi request cập nhật
    Swal.fire({
      title: 'Đang cập nhật...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await adminApi.updateRequestStatus(request.requestId, {
        status: 'APPROVED',
        adminResponse: formValues.adminResponse,
      });

      // Bước 3: Hiển thị kết quả
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Yêu cầu đã được phê duyệt và cập nhật trạng thái.',
          confirmButtonText: 'OK',
        }).then(() => {
          const updatedRequest = { ...request, status: 'APPROVED', adminResponse: formValues.adminResponse };
          setSelectedRequest(updatedRequest);
          loadRequests(); // reload danh sách
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.message || 'Không thể cập nhật yêu cầu.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi hệ thống',
        text: 'Có lỗi xảy ra khi gửi yêu cầu đến server.',
      });
      console.error(error);
    }
  };


  // Hàm cập nhật trạng thái chung (có nhập phản hồi)
  const handleUpdateStatus = async (request, newStatus, confirmText, defaultResponse) => {
    const { value: adminResponse } = await Swal.fire({
      title: confirmText,
      input: "textarea",
      inputLabel: "Nội dung phản hồi",
      inputValue: defaultResponse || "",
      inputPlaceholder: "Nhập nội dung phản hồi...",
      inputAttributes: { "aria-label": "Nhập nội dung phản hồi" },
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      reverseButtons: true,
      preConfirm: (value) => {
        if (!value.trim()) {
          Swal.showValidationMessage("Vui lòng nhập nội dung phản hồi!");
          return false;
        }
        return value.trim();
      },
    });

    if (!adminResponse) return;

    Swal.fire({
      title: "Đang cập nhật trạng thái...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await adminApi.updateRequestStatus(request.requestId, {
        status: newStatus,
        adminResponse,
      });

      if (res.success) {
        Swal.fire("Thành công!", `Trạng thái đã chuyển sang "${newStatus}".`, "success");
        loadRequests();
      } else {
        Swal.fire("Lỗi!", res.message || "Không thể cập nhật trạng thái.", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Lỗi hệ thống", "Không thể kết nối tới máy chủ.", "error");
    }
  };


  const handleChangeUserRole = async (userId, requestId) => {
    Swal.fire({
      title: "Xác nhận cấp quyền?",
      text: "Bạn có chắc muốn cấp quyền Landlord cho người dùng này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Có, cấp quyền ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Đang xử lý...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        // 1️⃣ Cấp quyền landlord cho user
        const resRole = await adminApi.updateUserRole(userId, "landlord");

        if (!resRole.success && !resRole.message?.includes("thành công")) {
          Swal.fire("Lỗi!", resRole.message || "Không thể cấp quyền người dùng.", "error");
          return;
        }

        // 2️⃣ Cập nhật trạng thái request -> APPROVED
        const resStatus = await adminApi.updateRequestStatus(requestId, {
          status: "APPROVED",
          adminResponse: "Yêu cầu đã được phê duyệt và quyền Landlord đã được cấp.",
        });

        if (!resStatus.success) {
          Swal.fire("Cảnh báo", "Cấp quyền thành công nhưng không thể cập nhật trạng thái yêu cầu.", "warning");
        }

        // 3️⃣ Hiển thị thông báo thành công
        Swal.fire("Thành công!", "Quyền Landlord đã được cấp và yêu cầu đã phê duyệt.", "success").then(() => {
          loadRequests();
          setModalVisible(false);
        });

      } catch (error) {
        console.error(error);
        Swal.fire("Lỗi hệ thống", "Không thể xử lý yêu cầu này.", "error");
      }
    });
  };



  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { label: 'Chờ xử lý', icon: <ClockCircleOutlined />, color: 'orange' },
      APPROVED: { label: 'Đã phê duyệt', icon: <ClockCircleOutlined spin />, color: 'blue' },
      RESOLVED: { label: 'Đã giải quyết', icon: <CheckCircleOutlined />, color: 'green' },
      RECEIVED: { label: 'Đã nhận', icon: <CheckCircleOutlined />, color: 'green' },
      IN_PROGRESS: { label: 'Đang tiến hành', icon: <CheckCircleOutlined />, color: 'green' },
      REJECTED: { label: 'Đã từ chối', icon: <CloseCircleOutlined />, color: 'red' }
    };
    return configs[status] || configs.PENDING;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = activeTab === 'all' || req.status === activeTab;
    const matchesSearch =
      !searchText ||
      req.subject?.toLowerCase().includes(searchText.toLowerCase()) ||
      req.message?.toLowerCase().includes(searchText.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status) => {
    if (status === 'all') return requests.length;
    return requests.filter(req => req.status === status).length;
  };

  const tabItems = [
    { key: 'all', label: <span className="flex items-center gap-2"><FileTextOutlined /> Tất cả <Badge count={getStatusCount('all')} showZero className="ml-1" /></span> },
    { key: 'PENDING', label: <span className="flex items-center gap-2"><ClockCircleOutlined /> Chờ xử lý <Badge count={getStatusCount('PENDING')} showZero className="ml-1" style={{ backgroundColor: '#faad14' }} /></span> },
    { key: 'APPROVED', label: <span className="flex items-center gap-2"><ClockCircleOutlined spin /> Đã phê duyệt <Badge count={getStatusCount('APPROVED')} showZero className="ml-1" style={{ backgroundColor: '#1890ff' }} /></span> },
    { key: 'IN_PROGRESS', label: <span className="flex items-center gap-2"><CloseCircleOutlined /> Đang tiến hành <Badge count={getStatusCount('IN_PROGRESS')} showZero className="ml-1" style={{ backgroundColor: '#52c41a' }} /></span> },
    { key: 'RESOLVED', label: <span className="flex items-center gap-2"><CheckCircleOutlined /> Đã giải quyết <Badge count={getStatusCount('RESOLVED')} showZero className="ml-1" style={{ backgroundColor: '#ff4d4f' }} /></span> },
    { key: 'REJECTED', label: <span className="flex items-center gap-2"><CloseCircleOutlined /> Đã từ chối <Badge count={getStatusCount('REJECTED')} showZero className="ml-1" style={{ backgroundColor: '#ff4d4f' }} /></span> },
    { key: 'RECEIVED', label: <span className="flex items-center gap-2"><CloseCircleOutlined /> Đã nhận <Badge count={getStatusCount('RECEIVED')} showZero className="ml-1" style={{ backgroundColor: '#ff4d4f' }} /></span> },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200   ">
          <div className="max-w-7xl flex justify-between items-center  ">
            <div className=''>
              <h1 className="text-3xl font-bold text-gray-900ml">Quản lý yêu cầu</h1>
              <p className="text-gray-600 mt-1">Theo dõi và quản lý các yêu cầu của bạn</p>
            </div>
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadRequests} loading={loading} size="large">Làm mới</Button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4">
            <Input placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} size="large" allowClear className="flex-1" />
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden ">
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" className="px-6" />
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-20"><Spin size="large" tip="Đang tải dữ liệu..." /></div>
              ) : filteredRequests.length === 0 ? (
                <Empty description="Không có yêu cầu nào" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-20" />
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredRequests.map(request => {
                    const typeConfig = getTypeConfig(request.type);
                    const statusConfig = getStatusConfig(request.status);
                    const isApproved = request.status === 'APPROVED' || request.status === 'RECEIVED';
                    const isRejected = request.status === 'REJECTED';

                    return (
                      <Card
                        key={request.requestId}
                        hoverable={!isApproved && !isRejected}
                        className={`
        transition-all duration-300 border relative 
        hover:shadow-lg hover:-translate-y-1
        ${isApproved ? 'border-green-300' : isRejected ? 'border-red-300' : 'border-gray-200'}
      `}
                        style={{
                          backgroundColor: isApproved
                            ? '#daffda' // xanh nhạt
                            : isRejected
                              ? '#ffe6e6' // đỏ nhạt
                              : '#ffffff' // mặc định trắng
                        }}
                        onClick={() => handleViewDetail(request)}
                      >
                        {/* Dấu tích lớn cho approved */}
                        {isApproved && (
                          <CheckCircleOutlined
                            style={{
                              fontSize: 36,
                              color: '#52c41a',
                              position: 'absolute',
                              top: 16,
                              right: 16,
                            }}
                          />
                        )}

                        {/* Dấu X lớn cho rejected */}
                        {isRejected && (
                          <CloseCircleOutlined
                            style={{
                              fontSize: 36,
                              color: '#ff4d4f',
                              position: 'absolute',
                              top: 16,
                              right: 16,
                            }}
                          />
                        )}

                        {/* Nội dung chính card */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div
                            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                            style={{
                              backgroundColor: isApproved
                                ? '#40a9ff'
                                : isRejected
                                  ? '#ffccc7'
                                  : typeConfig.color === 'blue'
                                    ? '#bae7ff'
                                    : '#f0f0f0',
                              color: isApproved
                                ? '#fff'
                                : isRejected
                                  ? '#a8071a'
                                  : typeConfig.color === 'blue'
                                    ? '#0050b3'
                                    : '#000',
                            }}
                          >
                            {typeConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className={`text-lg font-semibold truncate ${isApproved
                                      ? 'text-blue-900'
                                      : isRejected
                                        ? 'text-red-800'
                                        : 'text-gray-900'
                                    }`}
                                >
                                  {request.subject}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Tag
                                    color={isApproved ? 'blue' : isRejected ? 'red' : typeConfig.color}
                                    icon={typeConfig.icon}
                                    className="rounded-full"
                                  >
                                    {typeConfig.label}
                                  </Tag>
                                  <Badge
                                    status={
                                      isApproved
                                        ? 'success'
                                        : isRejected
                                          ? 'error'
                                          : statusConfig.color === 'blue'
                                            ? 'processing'
                                            : statusConfig.color === 'green'
                                              ? 'success'
                                              : statusConfig.color === 'orange'
                                                ? 'warning'
                                                : 'default'
                                    }
                                    text={statusConfig.label}
                                  />
                                </div>
                              </div>
                            </div>
                            <p
                              className={`text-gray-600 line-clamp-2 mb-3 ${isApproved ? 'text-blue-800' : isRejected ? 'text-red-700' : ''
                                }`}
                            >
                              {request.message}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                              <div className="flex items-center gap-4 text-gray-500">
                                <span>Tạo: {formatDate(request.createdAt)}</span>
                                <span>•</span>
                                <span>Cập nhật: {formatDate(request.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        <Modal title={null} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={700} className="request-detail-modal">
          {selectedRequest && (
            <div className="py-2">
              <div className="flex items-start gap-4 mb-6">
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-${getTypeConfig(selectedRequest.type).color}-100 flex items-center justify-center text-${getTypeConfig(selectedRequest.type).color}-600 text-2xl`}>{getTypeConfig(selectedRequest.type).icon}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRequest.subject}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color={getTypeConfig(selectedRequest.type).color} icon={getTypeConfig(selectedRequest.type).icon}>{getTypeConfig(selectedRequest.type).label}</Tag>
                    <Tag color={getStatusConfig(selectedRequest.status).color} icon={getStatusConfig(selectedRequest.status).icon}>{getStatusConfig(selectedRequest.status).label}</Tag>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Nội dung</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{selectedRequest.message}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Thông tin</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Mã yêu cầu</p>
                      <p className="text-sm font-mono text-gray-900 break-all">{selectedRequest.requestId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Người tạo</p>
                      <p
                        className="text-sm font-bold hover:underline cursor-pointer"
                        onClick={() => handleViewUserDetail(selectedRequest.userId)}
                      >
                        {(() => {
                          const user = users.find(u => u.userId === selectedRequest.userId);
                          if (!user) return selectedRequest.userId;
                          const roleVN = {
                            admin: 'Quản trị viên',
                            landlord: 'Chủ trọ',
                            user: 'Người dùng'
                          }[user.userType] || 'Chưa xác định';

                          return `${user.fullName || user.phoneNumber || user.cognitoUsername} (${roleVN})`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Timeline</h3>
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        children: (
                          <div>
                            <p className="font-medium">Yêu cầu được tạo</p>
                            <p className="text-sm text-gray-500">{new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                        )
                      },
                      {
                        color: selectedRequest.status === 'APPROVED' ? 'green' : getStatusConfig(selectedRequest.status).color,
                        children: (
                          <div>
                            <p className="font-medium">Trạng thái: {getStatusConfig(selectedRequest.status).label}</p>
                            <p className="text-sm text-gray-500">{new Date(selectedRequest.updatedAt).toLocaleString('vi-VN')}</p>
                          </div>
                        )
                      }
                    ]}
                  />

                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t ">
                {/* Loại LANDLORD_REQUEST */}
                {selectedRequest.type === "LANDLORD_REQUEST" && (
                  <>
                    {selectedRequest.status === "PENDING" && (
                      <Button
                        type="primary"
                        size="large"
                        onClick={() =>
                          handleUpdateStatus(
                            selectedRequest,
                            "IN_PROGRESS",
                            "Chuyển sang trạng thái 'Đang thực hiện'?",
                            "Yêu cầu đã được chuyển sang trạng thái đang thực hiện."
                          )
                        }
                      >
                        Chuyển sang "Đang thực hiện"
                      </Button>
                    )}

                    {selectedRequest.status === "IN_PROGRESS" && (
                      <>
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => handleChangeUserRole(selectedRequest.userId, selectedRequest.requestId)}
                        >
                          Cấp quyền Chủ Trọ
                        </Button>

                        <Button
                          danger
                          size="large"
                          onClick={() =>
                            handleUpdateStatus(
                              selectedRequest,
                              "REJECTED",
                              "Từ chối yêu cầu này?",
                              "Yêu cầu đã bị từ chối do không đủ điều kiện."
                            )
                          }
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                  </>
                )}

                {/* Loại khác (BUG_REPORT, FEATURE_REQUEST, GENERAL, FEEDBACK) */}
                {["BUG_REPORT", "FEATURE_REQUEST", "GENERAL", "FEEDBACK"].includes(selectedRequest.type) &&
                  selectedRequest.status === "PENDING" && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={() =>
                        handleUpdateStatus(
                          selectedRequest,
                          "RECEIVED",
                          "Xác nhận đã đọc yêu cầu này?",
                          "Yêu cầu đã được tiếp nhận và đánh dấu là đã đọc."
                        )
                      }
                    >
                      Xác nhận đã đọc
                    </Button>
                  )}

                {/* Giữ lại nút phê duyệt (chung cho các loại khi cần) */}
                {selectedRequest.status === "PENDING" && selectedRequest.type === "LANDLORD_REQUEST" && (
                  <Button
                    type="default"
                    size="large"
                    onClick={() => handleEditStatus(selectedRequest)}
                  >
                    Phê duyệt yêu cầu
                  </Button>
                )}

                <Button size="large" onClick={() => setModalVisible(false)}>
                  Đóng
                </Button>
              </div>


            </div>
          )}
        </Modal>
        <Modal
          title="Thông tin người tạo"
          open={userModalVisible}
          onCancel={() => setUserModalVisible(false)}
          footer={null}
          width={500}
        >
          {selectedUser ? (
            <div className="space-y-3 text-gray-800">
              <p><strong>ID:</strong> {selectedUser.userId}</p>
              <p><strong>Họ tên:</strong> {selectedUser.fullName || 'Chưa có'}</p>
              <p><strong>Số điện thoại:</strong> {selectedUser.phoneNumber}</p>
              <p><strong>Email:</strong> {selectedUser.email || 'Chưa có'}</p>
              <p><strong>Loại tài khoản:</strong> {selectedUser.userType}</p>
              <p><strong>Đăng nhập gần nhất:</strong> {new Date(selectedUser.lastLoginAt).toLocaleString('vi-VN')}</p>
              <p><strong>Ngày tạo:</strong> {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}</p>
            </div>
          ) : (
            <div className="text-center text-gray-500">Đang tải thông tin người dùng...</div>
          )}
        </Modal>

      </div>
    </AdminLayout>
  );

};

export default RequestListPage;
