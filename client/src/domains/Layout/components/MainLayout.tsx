import {Layout} from "antd";
import React from "react";
import {Link, Outlet} from "react-router-dom";
import styled from "styled-components";

const AppLayout = styled(Layout)`
  height: 100%;
`;

const MainLayout = () => (
  <AppLayout>
    <Layout.Header>
      <Link to={"/"}>Feed</Link>
      <Link to={"/week"}>Week</Link>
    </Layout.Header>
    <Layout.Content>
      <Outlet />
    </Layout.Content>
  </AppLayout>
);

export default MainLayout;
