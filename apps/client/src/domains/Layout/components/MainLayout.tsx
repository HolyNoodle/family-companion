import {Layout, Space} from "antd";
import React from "react";
import {Link, Outlet} from "react-router-dom";
import styled from "styled-components";

const AppLayout = styled(Layout)`
  height: 100%;

  a {
    color: white;
  }
`;

const MainLayout = () => (
  <AppLayout>
    <Layout.Header>
      <Space>
        <Link to={"/"}>Feed</Link>
        <Link to={"/tasks"}>Tasks</Link>
        <Link to={"/dashboard"}>Dashboard</Link>
      </Space>
    </Layout.Header>
    <Layout.Content>
      <Outlet />
    </Layout.Content>
  </AppLayout>
);

export default MainLayout;
