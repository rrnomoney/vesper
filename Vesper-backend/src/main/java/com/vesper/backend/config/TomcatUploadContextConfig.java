package com.vesper.backend.config;

import org.apache.catalina.Context;
import org.apache.catalina.Host;
import org.apache.catalina.Wrapper;
import org.apache.catalina.core.StandardContext;
import org.apache.catalina.startup.Tomcat;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatUploadContextConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> uploadContextCustomizer(
            UploadStorageProperties uploadStorageProperties
    ) {
        return factory -> factory.addContextCustomizers(context -> {
            Host host = (Host) context.getParent();
            if (host.findChild("/uploads") != null) {
                return;
            }

            Context uploadContext = new StandardContext();
            uploadContext.setPath("/uploads");
            uploadContext.setDocBase(uploadStorageProperties.getUploadPath().toString());
            uploadContext.addLifecycleListener(new Tomcat.FixContextListener());

            Wrapper defaultServlet = uploadContext.createWrapper();
            defaultServlet.setName("default");
            defaultServlet.setServletClass("org.apache.catalina.servlets.DefaultServlet");
            defaultServlet.addInitParameter("readonly", "true");
            defaultServlet.setLoadOnStartup(1);
            uploadContext.addChild(defaultServlet);
            uploadContext.addServletMappingDecoded("/", "default");

            host.addChild(uploadContext);
        });
    }
}
