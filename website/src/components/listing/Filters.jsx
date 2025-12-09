import React from "react";
import { Input, Select, Button } from "antd";
import { SearchOutlined, FilterOutlined, DollarOutlined, EnvironmentOutlined, HomeOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const Filters = ({
  searchText,
  setSearchText,
  selectedLocation,
  setSelectedLocation,
  selectedType,
  setSelectedType,
  sortBy,
  setSortBy,
  priceFilter,
  setPriceFilter,
  onSearch
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

      <div className="mb-4">
        <Search
          placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
          prefix={<SearchOutlined className="text-gray-400" />}
          size="large"
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          onSearch={onSearch}
          allowClear
          enterButton={
            <Button type="primary" style={{ backgroundColor: '#e06a1a', borderColor: '#e06a1a' }}>
              Tìm kiếm
            </Button>
          }
          className="rounded-xl"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Location */}
        <Select
          size="large"
          value={selectedLocation}
          onChange={setSelectedLocation}
          className="w-full"
          suffixIcon={<EnvironmentOutlined />}
          placeholder="Địa điểm"
          allowClear
        >
          <Option value="">Tất cả địa điểm</Option>
          <Option value="Hà Nội">Hà Nội</Option>
          <Option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</Option>
          <Option value="Đà Nẵng">Đà Nẵng</Option>
          <Option value="Hải Phòng">Hải Phòng</Option>
          <Option value="Cần Thơ">Cần Thơ</Option>
        </Select>

        {/* Type */}
        <Select
          size="large"
          value={selectedType}
          onChange={setSelectedType}
          className="w-full"
          suffixIcon={<HomeOutlined />}
          placeholder="Loại nhà"
          allowClear
        >
          <Option value="">Tất cả loại</Option>
          <Option value="apartment">Chung cư</Option>
          <Option value="house">Nhà riêng</Option>
          <Option value="room">Phòng trọ</Option>
          <Option value="studio">Studio</Option>
        </Select>

        {/* Sort */}
        <Select
          size="large"
          value={sortBy}
          onChange={setSortBy}
          className="w-full"
          suffixIcon={<FilterOutlined />}
        >
          <Option value="newest">Mới nhất</Option>
          <Option value="price-asc">Giá thấp đến cao</Option>
          <Option value="price-desc">Giá cao đến thấp</Option>
          <Option value="area-desc">Diện tích lớn nhất</Option>
        </Select>

        {/* Price */}
        <Select
          size="large"
          value={priceFilter}
          onChange={setPriceFilter}
          className="w-full"
          suffixIcon={<DollarOutlined />}
        >
          <Option value="all">Tất cả mức giá</Option>
          <Option value="low">Dưới 3 triệu</Option>
          <Option value="medium">3 - 5 triệu</Option>
          <Option value="high">Trên 5 triệu</Option>
        </Select>
      </div>
    </div>
  );
};

export default Filters;
